"use client";
import { useState } from "react";
import { useLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Product = { id:number; name:string; price:string; moq:string; supplier:string; cat:string; emoji:string; verified:boolean };

const PRODUCTS: Product[] = [
  { id:1, name:"Fashion - Premium T-Shirt", price:"$25", moq:"MOQ: 10 pieces", supplier:"Batik Solo", cat:"Fashion", emoji:"👕", verified:true },
  { id:2, name:"Furniture - Wooden Chair", price:"$120", moq:"MOQ: 1 piece", supplier:"Jepara Wood", cat:"Furniture", emoji:"🪑", verified:true },
  { id:3, name:"Electronics - EV Charger 7kW", price:"$899", moq:"MOQ: 1 piece", supplier:"EV Indo", cat:"Electronics", emoji:"🔌", verified:true },
  { id:4, name:"Home & Garden - Solar Panel", price:"$350", moq:"MOQ: 2 pieces", supplier:"Solar Nusantara", cat:"Home", emoji:"☀️", verified:false },
  { id:5, name:"Beauty - Skincare Set", price:"$18", moq:"MOQ: 50 pieces", supplier:"Beauty Lab", cat:"Beauty", emoji:"🧴", verified:true },
  { id:6, name:"Sports - Bicycle MTB", price:"$420", moq:"MOQ: 1 piece", supplier:"Bike Factory", cat:"Sports", emoji:"🚲", verified:false },
  { id:7, name:"Packaging - Box Custom", price:"$0.8", moq:"MOQ: 1000 pieces", supplier:"Pack Indo", cat:"Packaging", emoji:"📦", verified:true },
  { id:8, name:"Food - Coffee Beans 1kg", price:"$15", moq:"MOQ: 20 kg", supplier:"Gayo Coffee", cat:"Food", emoji:"☕", verified:true },
];

const CATS = ["All","Fashion","Electronics","Furniture","Home","Beauty","Sports","Packaging","Food"];

export default function MarketPage(){
  const { t, lang } = useLang();
  const [q,setQ] = useState("");
  const [cat,setCat] = useState("All");
  const [showCats,setShowCats] = useState(false);

  const filtered = PRODUCTS.filter(p => (cat==="All"||p.cat===cat) && p.name.toLowerCase().includes(q.toLowerCase()));

  const title = lang==="id" ? "Market" : lang==="zh" ? "市场" : lang==="ja" ? "マーケット" : lang==="ko" ? "마켓" : "Market";
  const searchPh = lang==="id" ? "Cari produk, supplier, kategori..." : "Search products, suppliers, categories...";
  const catTitle = lang==="id" ? "Kategori untuk Anda" : "Categories for you";
  const freqTitle = lang==="id" ? "Sering dicari" : "Frequently searched";
  const guaranteed = lang==="id" ? "Voinnect Terjamin" : "Voinnect Guaranteed";
  const recTitle = lang==="id" ? "Rekomendasi untuk bisnis Anda" : "Recommended for your business";
  const view = lang==="id" ? "Lihat →" : "View →";

  return (
    <div style={{background:"#f5f6f8",minHeight:"100vh",paddingBottom:40}}>
      {/* TOP BAR - NO SIGN OUT HERE */}
      <div style={{background:"#fff",padding:"12px 16px",borderBottom:"1px solid #eee",position:"sticky",top:0,zIndex:20}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{fontWeight:900,fontSize:22,color:"#111"}}>V<span style={{color:"#ff6a00"}}>NECT</span> <span style={{fontSize:13,color:"#888",fontWeight:600}}>Market</span></div>
          <div style={{flex:1,minWidth:220,display:"flex",border:"2px solid #ff6a00",borderRadius:999,overflow:"hidden",background:"#fff"}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder={searchPh} style={{flex:1,padding:"10px 14px",border:"none",outline:"none",fontSize:14}} />
            <button style={{background:"#ff6a00",color:"#fff",border:"none",padding:"0 20px",fontWeight:700,cursor:"pointer"}}>🔍 {lang==="id"?"Cari":"Search"}</button>
          </div>
          <button onClick={()=>setShowCats(!showCats)} style={{border:"1px solid #ddd",background:"#fff",padding:"10px 14px",borderRadius:999,cursor:"pointer",fontWeight:600}}>☰ {lang==="id"?"Semua Kategori":"All categories"}</button>
        </div>
        <div style={{maxWidth:1100,margin:"8px auto 0",display:"flex",gap:16,fontSize:13,color:"#555",flexWrap:"wrap"}}>
          <span style={{fontWeight:700,color:"#ff6a00"}}>Products</span><span>Verified Suppliers</span><span>Dropshipping</span><span>About Market</span><span>Help Center</span>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"16px"}}>
        {/* CATEGORIES + HERO */}
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          <div style={{width:230,background:"#fff",borderRadius:16,padding:12}}>
            <div style={{fontWeight:800,marginBottom:8}}>⭐ {catTitle}</div>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 10px",border:"none",borderRadius:10,cursor:"pointer",background:cat===c?"#fff1e6":"transparent",fontWeight:cat===c?700:400}}>{c==="All"?"✨ "+(lang==="id"?"Semua":"All"): "• "+c} {cat===c?"›":""}</button>
            ))}
          </div>

          <div style={{flex:1,minWidth:280}}>
            {showCats && (
              <div style={{background:"#fff",borderRadius:16,padding:16,marginBottom:12}}>
                <div style={{fontWeight:800,marginBottom:12}}>{catTitle}</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                  {CATS.filter(c=>c!=="All").map(c=>(
                    <button key={c} onClick={()=>{setCat(c); setShowCats(false);}} style={{border:"1px solid #eee",background:"#fafafa",borderRadius:12,padding:12,cursor:"pointer"}}>
                      <div style={{fontSize:28}}>{c==="Fashion"?"👕":c==="Electronics"?"🔌":c==="Furniture"?"🪑":c==="Home"?"🏠":c==="Beauty"?"💄":c==="Sports"?"⚽":c==="Packaging"?"📦":"☕"}</div>
                      <div style={{fontSize:12,marginTop:6,fontWeight:600}}>{c}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{background:"#fff",borderRadius:16,padding:16,display:"flex",gap:12,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontWeight:800}}>{freqTitle} - EV Charger</div>
                <div style={{fontSize:44,marginTop:10}}>🔌</div>
                <div style={{fontSize:13,color:"#666"}}>7kW • Portable • Fast Charging</div>
              </div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontWeight:800}}>{freqTitle} - Coffee</div>
                <div style={{fontSize:44,marginTop:10}}>☕</div>
                <div style={{fontSize:13,color:"#666"}}>Gayo • Single Origin • 1kg</div>
              </div>
              <div style={{flex:1,minWidth:200,background:"linear-gradient(135deg,#ff6a00,#ffb347)",borderRadius:12,padding:14,color:"#fff"}}>
                <div style={{fontWeight:900,fontSize:18}}>Hot Picks</div>
                <div style={{fontSize:13,opacity:.9}}>Best sellers this week</div>
                <div style={{fontSize:36,marginTop:8}}>🎒 👕 🪑</div>
              </div>
            </div>

            {/* GUARANTEED */}
            <div style={{background:"#3b2320",color:"#fff",borderRadius:16,padding:16,marginTop:12,display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontWeight:900,fontSize:20,color:"#ffb347"}}>Voinnect <span style={{color:"#fff"}}>{guaranteed}</span></div>
                <div style={{fontSize:13,marginTop:6,lineHeight:1.6}}>✓ {lang==="id"?"Order cepat & bayar aman":"Quick order and pay"}<br/>✓ {lang==="id"?"Pengiriman tepat waktu":"On-time delivery"}<br/>✓ {lang==="id"?"Garansi uang kembali":"Money-back guarantee"}</div>
                <button style={{marginTop:10,background:"#fff",border:"none",padding:"8px 14px",borderRadius:999,fontWeight:700,cursor:"pointer"}}>Explore now</button>
              </div>
              <div style={{display:"flex",gap:10}}>
                <div style={{background:"#fff",color:"#111",borderRadius:12,padding:10,width:120,textAlign:"center"}}><div style={{fontSize:28}}>🚗</div><div style={{fontWeight:800}}>Rp 1.313.976</div><div style={{fontSize:11,color:"#666"}}>Delivery by 01 Jan</div></div>
                <div style={{background:"#fff",color:"#111",borderRadius:12,padding:10,width:120,textAlign:"center"}}><div style={{fontSize:28}}>🔌</div><div style={{fontWeight:800}}>Rp 1.914.650</div><div style={{fontSize:11,color:"#666"}}>Delivery by 01 Jan</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCTS */}
        <div style={{marginTop:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{margin:0}}>— {recTitle} —</h3>
          <span style={{fontSize:13,color:"#888"}}>{filtered.length} products</span>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14,marginTop:12}}>
          {filtered.map(p=>(
            <div key={p.id} style={{background:"#fff",borderRadius:16,overflow:"hidden",border:"1px solid #eee"}}>
              <div style={{height:160,display:"flex",alignItems:"center",justifyContent:"center",fontSize:64,background:"#fafafa"}}>{p.emoji}</div>
              <div style={{padding:12}}>
                <div style={{fontWeight:700,fontSize:14,lineHeight:1.4,minHeight:38}}>{p.name}</div>
                <div style={{fontSize:12,color:"#888",marginTop:4}}>{p.moq}</div>
                <div style={{fontWeight:900,fontSize:17,marginTop:6}}>{p.price}</div>
                <div style={{fontSize:12,color:"#555",marginTop:2}}>Supplier: {p.supplier} {p.verified?"✓ Verified":""}</div>
                <button style={{marginTop:10,width:"100%",background:"#2563eb",color:"#fff",border:"none",padding:"9px",borderRadius:999,fontWeight:700,cursor:"pointer"}}>{view}</button>
              </div>
            </div>
          ))}
        </div>
        {filtered.length===0 && <div style={{background:"#fff",padding:20,borderRadius:12,marginTop:12,textAlign:"center"}}>{lang==="id"?"Tidak ada produk, coba kata lain":"No products, try another keyword"}</div>}

        <div style={{textAlign:"center",color:"#999",fontSize:12,marginTop:24}}>© Voinnect Market • Buyer & Supplier in one place • Sign Out ada di Dashboard / Home saja, tidak di Market</div>
      </div>
    </div>
  );
}
