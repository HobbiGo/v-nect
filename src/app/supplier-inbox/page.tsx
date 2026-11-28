"use client";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
export const dynamic = "force-dynamic";
const MSGS = [
  { id:"VM-10294", type:"New Order", from:"Johan • CV. Nusantara Retail", time:"Today 09:24 • NEW", title:"50 pcs T-Shirt • $995 • Fee 5% $49.75", body:"Buyer: Johan Wijay, CV. Nusantara Retail, Jl. Sudirman No.88 Jakarta. Produk: Classic Batik Shirt Navy/Gold, Qty 50 pcs, Subtotal $995, Fee $49.75, Total $1044.75. Note: Please ensure batik quality premium. Delivery by 5 Dec 2026.", tag:"Order" },
  { id:"VM-10295", type:"Sample Request", from:"PT. Sinar Jaya • Studio Kala", time:"Yesterday 16:10 • READ", title:"2 pcs Leather Tote • Sample Bisnis • Cek kualitas sebelum bulk 500 pcs", body:"Pembeli: PT. Sinar Jaya, mau cek kualitas kulit, jahitan, warna sebelum order besar 500 pcs. Minta sample 2 warna: hitam + coklat, untuk presentasi ke client. Alamat: Jakarta.", tag:"Sample" },
];
export default function SupplierInbox(){
  const { lang } = useLang();
  const [sel,setSel] = useState(0);
  const m = MSGS[sel];
  return (
    <div style={{background:"#f6f7fb",minHeight:"100vh",fontFamily:"system-ui"}}>
      <div style={{background:"#0A1A33",color:"#fff",padding:"14px 16px"}}><div style={{maxWidth:1120,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontWeight:900,fontSize:20}}>VN<span style={{color:"#FF6A00"}}>ECT</span> <span style={{fontSize:12,background:"#FF6A00",padding:"2px 7px",borderRadius:999}}>SUPPLIER INBOX</span></div><span style={{fontSize:13}}>Inbox • 2 unread</span></div></div>
      <div style={{maxWidth:1120,margin:"0 auto",padding:16,display:"flex",gap:16,flexWrap:"wrap"}}>
        <div style={{width:300,background:"#fff",borderRadius:20,padding:16,boxShadow:"0 6px 20px rgba(0,0,0,0.07)",height:"fit-content"}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{width:56,height:56,borderRadius:16,background:"#0A1A33",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>BSJ</div><div><div style={{fontWeight:900}}>PT. Batik Solo Jaya</div><div style={{fontSize:12,color:"#666"}}>Supplier ID: supplier_001</div><div style={{fontSize:12,color:"#FF6A00",fontWeight:800}}>✓ Verified Business • Premium</div></div></div>
          <div style={{display:"flex",gap:10,marginTop:14,alignItems:"center"}}><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover"}} alt="owner" /><div style={{fontSize:13}}><b>Andi Saputra</b><div style={{color:"#666",fontSize:12}}>Supplier Owner • Foto Personal</div></div></div>
          <div style={{fontSize:13,lineHeight:1.6,marginTop:12,background:"#f6f7fb",padding:12,borderRadius:14}}>Spesialis Batik Tulis Solo, sejak 2015, 50 pengrajin, ekspor ke 5 negara. MOQ 20 pcs • Wholesale & B2B. Lokasi: Surakarta, Central Java.</div>
          <div style={{display:"flex",gap:8,marginTop:12,fontSize:12}}><span style={{background:"#FFF1E6",padding:"6px 10px",borderRadius:999}}>⭐ 4.9 (128)</span><span style={{background:"#eef",padding:"6px 10px",borderRadius:999}}>342 Orders</span><span style={{background:"#e6f7ee",padding:"6px 10px",borderRadius:999}}>98% Response</span></div>
          <div style={{fontSize:12,color:"#888",marginTop:10}}>Member since Jan 2023 • Logo perusahaan + Foto personal + Keterangan lengkap</div>
        </div>
        <div style={{flex:1,minWidth:280,display:"flex",gap:16,flexWrap:"wrap"}}>
          <div style={{width:280,background:"#fff",borderRadius:20,padding:12,height:"fit-content"}}><b>Inbox • 2 unread</b>{MSGS.map((x,i)=>(<button key={x.id} onClick={()=>setSel(i)} style={{display:"block",width:"100%",textAlign:"left",marginTop:10,padding:12,borderRadius:14,border:i===sel?"2px solid #FF6A00":"1px solid #eee",background:i===sel?"#FFF7ED":"#fff",cursor:"pointer"}}><div style={{fontSize:11,color:"#FF6A00",fontWeight:800}}>{x.type} • {x.id}</div><div style={{fontWeight:800,fontSize:13,marginTop:4}}>{x.title}</div><div style={{fontSize:12,color:"#666",marginTop:4}}>{x.from}<br/>{x.time}</div></button>))}</div>
          <div style={{flex:1,minWidth:280,background:"#fff",borderRadius:20,padding:16,height:"fit-content"}}><div style={{fontSize:12,color:"#FF6A00",fontWeight:800}}>{m.type} • {m.id}</div><h3 style={{margin:"8px 0"}}>{m.title}</h3><div style={{fontSize:13,color:"#666"}}>{m.from} • {m.time}</div><div style={{fontSize:14,lineHeight:1.7,marginTop:12,background:"#f6f7fb",padding:14,borderRadius:14}}>{m.body}</div><div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}><button style={{background:"#FF6A00",color:"#fff",border:"none",padding:"11px 18px",borderRadius:999,fontWeight:800,cursor:"pointer"}}>✅ Accept Order</button><button style={{background:"#fff",border:"1px solid #0A1A33",padding:"11px 18px",borderRadius:999,fontWeight:700,cursor:"pointer"}}>✈️ Send Sample</button><button style={{background:"#f1f1f1",border:"none",padding:"11px 18px",borderRadius:999,cursor:"pointer"}}>Decline</button></div><div style={{fontSize:12,color:"#888",marginTop:12}}>Data ini nyambung ke Account Supplier yang sudah isi (supplier_001) • Nanti dikonekkan ke Supabase tabel supplier_messages • Fee 5% otomatis</div></div>
        </div>
      </div>
    </div>
  );
}
