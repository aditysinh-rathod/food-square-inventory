"use client";
import {useEffect,useState} from "react"; import {createClient} from "@/lib/supabase/client";
export default function DeductionForm({mode}:{mode:"CONSUMPTION"|"WASTAGE"}){
 const [products,setProducts]=useState<any[]>([]),[msg,setMsg]=useState("");
 useEffect(()=>{createClient().from("products").select("id,name,unit").eq("is_active",true).order("name").then(({data})=>setProducts(data||[]))},[]);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setMsg("Processing FEFO...");const f=new FormData(e.currentTarget);const db=createClient();
 const {error}=await db.rpc("deduct_inventory_fefo",{p_product_id:f.get("product_id"),p_quantity:Number(f.get("quantity")),p_movement_type:mode,p_reason:String(f.get("reason")||mode),p_notes:String(f.get("notes")||"")});
 setMsg(error?error.message:`${mode==="CONSUMPTION"?"Consumption":"Wastage"} recorded successfully.`);if(!error)e.currentTarget.reset();}
 return <form className="form card" onSubmit={submit}><div className="field"><label>Product</label><select required name="product_id"><option value="">Select product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}</select></div><div className="field"><label>Quantity</label><input required min="0.001" step="0.001" type="number" name="quantity"/></div>{mode==="WASTAGE"&&<div className="field"><label>Reason</label><select name="reason"><option>Expired</option><option>Damaged</option><option>Spoiled</option><option>Kitchen Waste</option><option>Customer Return</option><option>Other</option></select></div>}<div className="field"><label>Notes</label><textarea name="notes"/></div><button className={mode==="WASTAGE"?"btn danger":"btn"}>Save</button><div className="muted">{msg}</div></form>
}
