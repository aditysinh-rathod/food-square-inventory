-- Optional sample products
insert into public.products(name,sku,unit,minimum_stock_level,default_purchase_cost)
values
 ('Mozzarella Cheese','CHEESE-MOZZ-001','kg',5,450),
 ('Milk','DAIRY-MILK-001','litre',10,60)
on conflict(sku) do nothing;
