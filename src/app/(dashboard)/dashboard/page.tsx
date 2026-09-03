import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";

async function getData(){
 try{
  const db=await createClient();
  const [{data:batches},{data:products},{data:ledger},{data:waste}]=await Promise.all([
   db.from("inventory_batches").select("available_quantity,purchase_cost,expiry_date,status,products(name)").gt("available_quantity",0),
   db.from("products").select("id,minimum_stock_level,current_quantity"),
   db.from("inventory_ledger").select("created_at,movement_type,quantity_in,quantity_out,products(name),inventory_batches(batch_number)").order("created_at",{ascending:false}).limit(8),
   db.from("wastage_records").select("total_value,created_at").gte("created_at",new Date().toISOString().slice(0,10))
  ]);
  return {batches:batches||[],products:products||[],ledger:ledger||[],waste:waste||[]};
 }catch{return {batches:[],products:[],ledger:[],waste:[]}}
}
export default async function Dashboard(){
 const d=await getData(); const today=new Date(); const in3=new Date(Date.now()+3*864e5);
 const value=d.batches.reduce((s:any,b:any)=>s+Number(b.available_quantity)*Number(b.purchase_cost||0),0);
 const low=d.products.filter((p:any)=>Number(p.current_quantity)<=Number(p.minimum_stock_level)).length;
 const expSoon=d.batches.filter((b:any)=>b.expiry_date && new Date(b.expiry_date)>=today && new Date(b.expiry_date)<=in3).length;
 const expired=d.batches.filter((b:any)=>b.status==="EXPIRED").length;
 const waste=d.waste.reduce((s:any,w:any)=>s+Number(w.total_value||0),0);
 return <>
 <PageHeader title="Inventory Dashboard" subtitle="Estimated live stock based on recorded movements">
   <Link className="btn" href="/receive">+ Receive Stock</Link>
 </PageHeader>
 <div className="grid-kpi">
  {[
   ["Total Inventory Value",`₹${value.toFixed(0)}`],["Total Products",d.products.length],["Low Stock",low],
   ["Expiring Soon",expSoon],["Expired Stock",expired],["Today's Wastage",`₹${waste.toFixed(0)}`]
  ].map(([a,b])=><div className="card" key={String(a)}><div className="kpi-label">{a}</div><div className="kpi-value">{b}</div></div>)}
 </div>
 <div className="quick-grid" style={{marginTop:16}}>
  <Link className="quick" href="/receive">📦 Receive Stock</Link><Link className="quick" href="/consumption">🍳 Record Consumption</Link><Link className="quick" href="/wastage">🗑️ Record Wastage</Link>
 </div>
 <div className="two-col">
  <section className="card"><h3>Recent Stock Movements</h3><div className="table-wrap"><table><thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Qty</th></tr></thead><tbody>
  {d.ledger.length?d.ledger.map((x:any,i:number)=><tr key={i}><td>{new Date(x.created_at).toLocaleString()}</td><td>{x.products?.name||"—"}</td><td>{x.movement_type}</td><td>{x.quantity_in||x.quantity_out}</td></tr>):<tr><td colSpan={4}>No movements yet.</td></tr>}
  </tbody></table></div></section>
  <section className="card"><h3>Expiry Alerts</h3>{d.batches.filter((b:any)=>b.expiry_date).sort((a:any,b:any)=>String(a.expiry_date).localeCompare(String(b.expiry_date))).slice(0,6).map((b:any,i:number)=><div key={i} style={{padding:"10px 0",borderBottom:"1px solid #eee"}}><b>{b.products?.name}</b> · Batch {b.batch_number}<br/><span className="muted">Expiry: {b.expiry_date} · Available: {b.available_quantity}</span></div>)||"No expiry data"}</section>
 </div>
 </>;
}
