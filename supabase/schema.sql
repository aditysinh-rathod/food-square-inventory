-- FOOD SQUARE INVENTORY & EXPIRY SYSTEM
create extension if not exists "pgcrypto";

create type public.user_role as enum ('STAFF','MANAGER','ADMIN');
create type public.batch_status as enum ('ACTIVE','EXPIRING_SOON','EXPIRED','DEPLETED');
create type public.movement_type as enum (
 'OPENING_STOCK','PURCHASE','ADJUSTMENT_IN','TRANSFER_IN','RETURN_IN',
 'CONSUMPTION','SALES_ADJUSTMENT','WASTAGE','EXPIRED','DAMAGED','TRANSFER_OUT','ADJUSTMENT_OUT'
);
create type public.audit_status as enum ('PENDING','APPROVED','REJECTED');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text,
 role public.user_role not null default 'STAFF',
 created_at timestamptz not null default now()
);

create table public.categories (
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 description text,
 created_at timestamptz not null default now()
);

create table public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 sku text unique,
 category_id uuid references public.categories(id) on delete set null,
 unit text not null check (unit in ('kg','gram','litre','ml','piece','packet','box')),
 minimum_stock_level numeric(14,3) not null default 0 check(minimum_stock_level>=0),
 default_purchase_cost numeric(14,2) not null default 0 check(default_purchase_cost>=0),
 current_quantity numeric(14,3) not null default 0,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.suppliers (
 id uuid primary key default gen_random_uuid(),
 supplier_name text not null,
 contact_person text, phone text, email text, address text,
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);

create table public.inventory_batches (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id),
 supplier_id uuid references public.suppliers(id) on delete set null,
 batch_number text not null,
 manufacturing_date date,
 expiry_date date,
 received_date date not null default current_date,
 purchase_cost numeric(14,2) not null default 0,
 original_quantity numeric(14,3) not null check(original_quantity>=0),
 available_quantity numeric(14,3) not null check(available_quantity>=0),
 invoice_number text,
 status public.batch_status not null default 'ACTIVE',
 created_at timestamptz not null default now(),
 unique(product_id,batch_number,expiry_date)
);

create table public.inventory_ledger (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id),
 batch_id uuid references public.inventory_batches(id),
 movement_type public.movement_type not null,
 quantity_in numeric(14,3) not null default 0,
 quantity_out numeric(14,3) not null default 0,
 quantity_before numeric(14,3) not null,
 quantity_after numeric(14,3) not null,
 unit_cost numeric(14,2) not null default 0,
 total_value numeric(14,2) not null default 0,
 reason text,
 reference_id text,
 created_by uuid references public.profiles(id),
 created_at timestamptz not null default now(),
 check ((quantity_in>0 and quantity_out=0) or (quantity_out>0 and quantity_in=0))
);

create table public.wastage_records (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id),
 quantity numeric(14,3) not null,
 reason text not null,
 notes text,
 total_value numeric(14,2) not null default 0,
 created_by uuid references public.profiles(id),
 created_at timestamptz not null default now()
);

create table public.stock_audits (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id),
 system_quantity numeric(14,3) not null,
 physical_quantity numeric(14,3) not null,
 difference numeric(14,3) not null,
 reason text,
 status public.audit_status not null default 'PENDING',
 counted_by uuid references public.profiles(id),
 reviewed_by uuid references public.profiles(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);

create index batches_product_expiry_idx on public.inventory_batches(product_id,expiry_date);
create index ledger_product_created_idx on public.inventory_ledger(product_id,created_at desc);

create or replace function public.refresh_batch_statuses()
returns void language sql as $$
 update public.inventory_batches
 set status = case
   when available_quantity <= 0 then 'DEPLETED'::public.batch_status
   when expiry_date is not null and expiry_date < current_date then 'EXPIRED'::public.batch_status
   when expiry_date is not null and expiry_date <= current_date + 3 then 'EXPIRING_SOON'::public.batch_status
   else 'ACTIVE'::public.batch_status
 end;
$$;

create or replace function public.receive_inventory(
 p_product_id uuid,p_supplier_id uuid,p_quantity numeric,p_purchase_cost numeric,
 p_batch_number text,p_expiry_date date,p_manufacturing_date date default null,
 p_invoice_number text default null,p_received_date date default current_date
) returns uuid language plpgsql security definer as $$
declare v_batch_id uuid; v_before numeric; v_after numeric; v_user uuid := auth.uid();
begin
 if p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;
 if p_expiry_date < current_date then raise exception 'Cannot receive already-expired stock'; end if;
 select current_quantity into v_before from public.products where id=p_product_id for update;
 if v_before is null then raise exception 'Product not found'; end if;
 insert into public.inventory_batches(product_id,supplier_id,batch_number,manufacturing_date,expiry_date,received_date,purchase_cost,original_quantity,available_quantity,invoice_number)
 values(p_product_id,p_supplier_id,p_batch_number,p_manufacturing_date,p_expiry_date,p_received_date,p_purchase_cost,p_quantity,p_quantity,p_invoice_number)
 returning id into v_batch_id;
 v_after := v_before + p_quantity;
 update public.products set current_quantity=v_after,updated_at=now() where id=p_product_id;
 insert into public.inventory_ledger(product_id,batch_id,movement_type,quantity_in,quantity_before,quantity_after,unit_cost,total_value,reason,created_by)
 values(p_product_id,v_batch_id,'PURCHASE',p_quantity,0,p_quantity,p_purchase_cost,p_quantity*p_purchase_cost,'Stock received',v_user);
 perform public.refresh_batch_statuses();
 return v_batch_id;
end $$;

create or replace function public.deduct_inventory_fefo(
 p_product_id uuid,p_quantity numeric,p_movement_type public.movement_type,p_reason text default null,p_notes text default null
) returns void language plpgsql security definer as $$
declare
 v_remaining numeric:=p_quantity; v_take numeric; v_before numeric; v_after numeric; v_product_before numeric;
 b record; v_user uuid:=auth.uid(); v_total_value numeric:=0;
begin
 if p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if;
 if p_movement_type not in ('CONSUMPTION','WASTAGE','DAMAGED','EXPIRED','TRANSFER_OUT','ADJUSTMENT_OUT','SALES_ADJUSTMENT') then
  raise exception 'Invalid deduction movement type';
 end if;
 perform public.refresh_batch_statuses();
 select current_quantity into v_product_before from public.products where id=p_product_id for update;
 if v_product_before is null then raise exception 'Product not found'; end if;
 if v_product_before < p_quantity then raise exception 'Insufficient inventory'; end if;

 for b in select * from public.inventory_batches
   where product_id=p_product_id and available_quantity>0 and (expiry_date is null or expiry_date>=current_date)
   order by expiry_date nulls last, created_at
   for update
 loop
   exit when v_remaining<=0;
   v_take:=least(v_remaining,b.available_quantity);
   v_before:=b.available_quantity; v_after:=v_before-v_take;
   update public.inventory_batches set available_quantity=v_after where id=b.id;
   insert into public.inventory_ledger(product_id,batch_id,movement_type,quantity_out,quantity_before,quantity_after,unit_cost,total_value,reason,created_by)
   values(p_product_id,b.id,p_movement_type,v_take,v_before,v_after,b.purchase_cost,v_take*b.purchase_cost,coalesce(p_reason,p_movement_type::text),v_user);
   v_total_value:=v_total_value+(v_take*b.purchase_cost);
   v_remaining:=v_remaining-v_take;
 end loop;
 if v_remaining>0 then raise exception 'No valid non-expired batches available'; end if;
 update public.products set current_quantity=v_product_before-p_quantity,updated_at=now() where id=p_product_id;
 if p_movement_type='WASTAGE' then
   insert into public.wastage_records(product_id,quantity,reason,notes,total_value,created_by)
   values(p_product_id,p_quantity,coalesce(p_reason,'WASTAGE'),p_notes,v_total_value,v_user);
 end if;
 perform public.refresh_batch_statuses();
end $$;

-- Immutable ledger: block direct UPDATE/DELETE.
create or replace function public.prevent_ledger_mutation()
returns trigger language plpgsql as $$ begin raise exception 'Inventory ledger is immutable'; end; $$;
create trigger immutable_inventory_ledger before update or delete on public.inventory_ledger
for each row execute function public.prevent_ledger_mutation();

-- Simple RLS policies for authenticated application users.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.inventory_ledger enable row level security;
alter table public.wastage_records enable row level security;
alter table public.stock_audits enable row level security;

create policy "auth read profiles" on public.profiles for select to authenticated using(true);
create policy "auth read categories" on public.categories for select to authenticated using(true);
create policy "auth manage categories" on public.categories for all to authenticated using(true) with check(true);
create policy "auth read products" on public.products for select to authenticated using(true);
create policy "auth manage products" on public.products for all to authenticated using(true) with check(true);
create policy "auth read suppliers" on public.suppliers for select to authenticated using(true);
create policy "auth manage suppliers" on public.suppliers for all to authenticated using(true) with check(true);
create policy "auth read batches" on public.inventory_batches for select to authenticated using(true);
create policy "auth read ledger" on public.inventory_ledger for select to authenticated using(true);
create policy "auth read wastage" on public.wastage_records for select to authenticated using(true);
create policy "auth manage audits" on public.stock_audits for all to authenticated using(true) with check(true);

insert into public.categories(name,description) values
 ('Cheese','Cheese products'),('Dairy','Milk and dairy'),('Bakery','Bakery products'),
 ('Vegetables','Fresh vegetables'),('Beverages','Drinks'),('Packaging','Packaging materials'),
 ('Ingredients','Kitchen ingredients')
on conflict(name) do nothing;
