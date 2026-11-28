"use client";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
export const dynamic = "force-dynamic";

type P = { id:number; name:string; price:number; old?:number; rating:string; reviews:number; img:string; supplier:string; cat:string; badge?:string; views:string; picks:number; origin:string };
const PRODUCTS: P[] = [
  { id:1, name:"VNECT AirPods Pro+", price:189, old:249, rating:"4.8", reviews:128, img:"https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80", supplier:"Batik Solo • Verified", cat:"Earbuds", badge:"15% OFF", views:"12.4k", picks:342, origin:"🇮🇩 Indonesia" },
  { id:2, name:"VNECT Chrono Classic", price:429, old:520, rating:"4.9", reviews:98, img:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80", supplier:"Jepara Wood • Verified", cat:"Watches", badge:"Premium", views:"8.9k", picks:218, origin:"🇮🇩 Indonesia" },
  { id:3, name:"VNECT Leather Tote", price:189, rating:"4.7", reviews:76, img:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80", supplier:"Solo Leather • Verified", cat:"Bags", badge:"Best Seller", views:"15.2k", picks:512, origin:"🇮🇩 Indonesia" },
  { id:4, name:"ProPods X1", price:199, rating:"4.8", reviews:214, img:"https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&q=80", supplier:"EV Indo • Verified", cat:"Earbuds", views:"9.7k", picks:198, origin:"🇨🇳 China" },
  { id:5, name:"Ceramic Coffee Mug", price:18, rating:"4.6", reviews:64, img:"https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80", supplier:"Gayo Coffee", cat:"Home", views:"4.3k", picks:87, origin:"🇮🇩 Indonesia" },
  { id:6, name:"Modern Desk Lamp", price:64, rating:"4.7", reviews:92, img:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80", supplier:"Solar Nusantara", cat:"Home", views:"6.1k", picks:134, origin:"🇻🇳 Vietnam" },
];
const CATS = ["All","Earbuds","Watches","Bags","Home","Accessories","New Arrivals","Sale"];
export default function MarketPage(){
  const { lang } = useLang();
  const [q,setQ] = useState("");
  const [cat,setCat] = useState("All");
  const [cart,setCart] = useState<number[]>([]);
  const [showCart,setShowCart] = useState(false);
  const [open,setOpen] = useState("");
  const [orderType,setOrderType] = useState<"Bulk"|"Sample">("Bulk");
  const [showCheckout,setShowCheckout] = useState(false);
  const filtered = PRODUCTS.filter(p=>(cat==="All"||p.cat===cat||cat==="New Arrivals"||cat==="Sale") && p.name.toLowerCase().includes(q.toLowerCase()));
  const cartItems = PRODUCTS.filter(p=>cart.includes(p.id));
  const subtotal = cartItems.reduce((s,p)=>s+p.price,0);
  const fee = Math.round(subtotal*0.05*100)/100;
  const total = Math.round((subtotal+fee)*100)/100;
  const add = (id:number)=>{ if(!cart.includes(id)) setCart([...cart,id]); setShowCart(true); };
  return (
    <div style={{background:"#f6f7fb",minHeight:"100vh",fontFamily:"system-ui"}}>
      <div style={{background:"#0A1A33",color:"#fff",padding:"12px 16px",position:"sticky",top:0,zIndex:20}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{fontWeight:900,fontSize:24,letterSpacing:0.5}}>VN<span style={{color:"#FF6A00"}}>ECT</span><span style={{fontSize:12,background:"#FF6A00",padding:"2px 7px",borderRadius:999,marginLeft:8}}>MARKET</span></div>
          <div style={{flex:1,minWidth:220,display:"flex",background:"#fff",borderRadius:999,overflow:"hidden"}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder={lang==="id"?"Cari produk, supplier...":"Search products, suppliers..."} style={{flex:1,padding:"11px 16px",border:"none",outline:"none",fontSize:14}} />
            <button style={{background:"#FF6A00",color:"#fff",border:"none",padding:"0 22px",fontWeight:800,cursor:"pointer"}}>🔍</button>
          </div>
          <div style={{display:"flex",gap:8,fontSize:14,alignItems:"center"}}>
          <a href="/" style={{background:"#fff",color:"#0A1A33",padding:"8px 14px",borderRadius:999,fontWeight:800,textDecoration:"none",whiteSpace:"nowrap"}}>← Back to Home</a>
          <div style={{position:"relative"}}><button onClick={()=>setOpen(open==="shop"?"": "shop")} style={{background:open==="shop"?"#FF6A00":"transparent",color:"#fff",border:"none",padding:"8px 12px",borderRadius:999,fontWeight:700,cursor:"pointer"}}>Shop ▾</button>{open==="shop" && <div style={{position:"absolute",top:38,right:0,width:260,background:"#fff",color:"#111",borderRadius:16,boxShadow:"0 20px 50px rgba(0,0,0,0.25)",padding:10,zIndex:99}}><b style={{fontSize:13}}>🛍️ Shop — Semua Produk</b><div style={{fontSize:12,color:"#666",margin:"4px 0 8px"}}>Cari & filter semua produk supplier terverifikasi</div>{["All Products","Earbuds & Audio","Watches","Bags & Fashion","Home & Office","Accessories","New Arrivals","Sale"].map(c=>(<button key={c} onClick={()=>{setCat(c==="All Products"?"All":c); setOpen("");}} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 10px",border:"none",background:"transparent",cursor:"pointer",borderRadius:10,fontSize:13}}>• {c}</button>))}</div>}</div>
          <div style={{position:"relative"}}><button onClick={()=>setOpen(open==="col"?"":"col")} style={{background:open==="col"?"#FF6A00":"transparent",color:"#fff",border:"none",padding:"8px 12px",borderRadius:999,fontWeight:700,cursor:"pointer"}}>Collections ▾</button>{open==="col" && <div style={{position:"absolute",top:38,right:0,width:260,background:"#fff",color:"#111",borderRadius:16,boxShadow:"0 20px 50px rgba(0,0,0,0.25)",padding:10,zIndex:99}}><b style={{fontSize:13}}>✨ Collections — Kurasi Pilihan</b><div style={{fontSize:12,color:"#666",margin:"4px 0 8px"}}>Bukan semua produk, tapi paket yang sudah dikurasi</div>{[["Premium Picks","Produk premium rating 4.8+","All"],["Best Seller","Paling laris minggu ini","Bags"],["Sample Ready","Bisa sample dulu sebelum bulk","Earbuds"],["🌍 Global Collections","Semua negara — pilih origin di bawah","All"],["🇮🇩 Made in Indonesia","Batik, Jepara, Solo","Home"],["🇨🇳 Made in China","Elektronik, Aksesoris","Earbuds"],["🇯🇵 Made in Japan","Presisi, Minimalis","Watches"],["🇰🇷 Made in Korea","Beauty, Fashion","Bags"],["🇺🇸 Made in USA","Tech, Premium","Watches"],["🇻🇳 Made in Vietnam","Home, Craft","Home"],["Under $100","Hadiah & sample murah","Home"]].map(([t,d,c])=>(<button key={t} onClick={()=>{setCat(c as string); setOpen("");}} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 10px",border:"none",background:"transparent",cursor:"pointer",borderRadius:10}}><b style={{fontSize:13}}>{t}</b><div style={{fontSize:12,color:"#666"}}>{d}</div></button>))}</div>}</div>
          <div style={{position:"relative"}}><button onClick={()=>setOpen(open==="deal"?"":"deal")} style={{background:open==="deal"?"#FF6A00":"transparent",color:"#fff",border:"none",padding:"8px 12px",borderRadius:999,fontWeight:700,cursor:"pointer"}}>Deals ▾</button>{open==="deal" && <div style={{position:"absolute",top:38,right:0,width:260,background:"#fff",color:"#111",borderRadius:16,boxShadow:"0 20px 50px rgba(0,0,0,0.25)",padding:10,zIndex:99}}><b style={{fontSize:13}}>🔥 Deals — Diskon & Promo</b><div style={{fontSize:12,color:"#666",margin:"4px 0 8px"}}>Harga khusus, free shipping, sample gratis</div>{[["Today 15% OFF","Earbuds Pro+ $189 → $161","Earbuds"],["Free Shipping $100+","Semua produk, tanpa kode","All"],["Sample Gratis","Sample pertama gratis untuk bisnis","Earbuds"],["Bulk Discount","Order 50+ pcs, diskon 10%","Bags"]].map(([t,d,c])=>(<button key={t} onClick={()=>{setCat(c as string); setOpen("");}} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 10px",border:"none",background:"transparent",cursor:"pointer",borderRadius:10}}><b style={{fontSize:13}}>{t}</b><div style={{fontSize:12,color:"#666"}}>{d}</div></button>))}</div>}</div>
          <div style={{position:"relative"}}><button onClick={()=>setOpen(open==="acc"?"":"acc")} style={{background:open==="acc"?"#FF6A00":"#fff",color:open==="acc"?"#fff":"#0A1A33",border:"none",width:34,height:34,borderRadius:"50%",fontWeight:800,cursor:"pointer"}}>👤</button>{open==="acc" && <div style={{position:"absolute",top:40,right:0,width:260,background:"#fff",color:"#111",borderRadius:16,boxShadow:"0 20px 50px rgba(0,0,0,0.25)",padding:10,zIndex:99}}><div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{width:42,height:42,borderRadius:"50%",background:"#0A1A33",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>J</div><div><b style={{fontSize:13}}>Johan Wijay</b><div style={{fontSize:12,color:"#666"}}>Buyer • johan@email.com</div></div></div><div style={{height:1,background:"#eee",margin:"10px 0"}}></div>{[["🛒 My Cart","Lihat isi keranjang"],["📦 My Orders","Order & Sample yang sudah dibayar"],["♡ Wishlist","Produk yang disimpan"],["🏢 Supplier Profile","Logo + Foto + Keterangan"],["✉️ Supplier Inbox","Order masuk dari buyer"],["⚙️ Settings","Bahasa, Alamat, Notifikasi"]].map(([t,d])=>(<button key={t} onClick={()=>{if(t.includes("Inbox")) window.location.href="/supplier-inbox"; if(t.includes("Cart")) setShowCart(true); setOpen("");}} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 10px",border:"none",background:"transparent",cursor:"pointer",borderRadius:10}}><b style={{fontSize:13}}>{t}</b><div style={{fontSize:12,color:"#666"}}>{d}</div></button>))}<div style={{fontSize:11,color:"#999",marginTop:8,textAlign:"center"}}>Sign Out ada di Home / Dashboard saja, bukan di Market</div></div>}</div>
          <div style={{display:"flex",gap:4,background:"rgba(255,255,255,0.15)",padding:"4px",borderRadius:999}}>{[{f:"🇮🇩",l:"id",t:"ID"},{f:"🇺🇸",l:"en",t:"EN"},{f:"🇨🇳",l:"zh",t:"ZH"},{f:"🇯🇵",l:"ja",t:"JA"},{f:"🇰🇷",l:"ko",t:"KO"}].map(x=>(<button key={x.l} onClick={()=>{try{localStorage.setItem("voinnect_lang",x.l);}catch(e){} window.location.reload();}} title={x.t} style={{border:"none",background:"transparent",cursor:"pointer",fontSize:16,padding:"2px 4px",borderRadius:999,opacity:1}}>{x.f}</button>))}</div><span>♡</span><button onClick={()=>setShowCart(!showCart)} style={{background:"#FF6A00",color:"#fff",border:"none",padding:"8px 14px",borderRadius:999,fontWeight:800,cursor:"pointer"}}>🛒 Cart ({cart.length})</button></div>
        </div>
      </div>
      <div style={{maxWidth:1120,margin:"0 auto",padding:"16px"}}>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6}}>{CATS.map(c=>(<button key={c} onClick={()=>setCat(c)} style={{whiteSpace:"nowrap",border:"none",padding:"9px 16px",borderRadius:999,cursor:"pointer",background:cat===c?"#0A1A33":"#fff",color:cat===c?"#fff":"#333",fontWeight:700,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>{c}</button>))}</div>
        <div style={{background:"linear-gradient(135deg,#0A1A33 0%,#1A3A6A 55%,#FF6A00 130%)",borderRadius:24,padding:22,display:"flex",gap:18,alignItems:"center",flexWrap:"wrap",color:"#fff",marginTop:12}}>
          <div style={{flex:1,minWidth:260}}>
            <div style={{fontSize:12,letterSpacing:2,color:"#FFB27A",fontWeight:800}}>VOINNECT MARKET • PREMIUM</div>
            <h1 style={{fontSize:34,lineHeight:1.1,margin:"10px 0"}}>Elevate Your<br/>Everyday, Crafted<br/>in Luxury.</h1>
            <p style={{opacity:0.85,fontSize:14}}>Produk pilihan dari supplier terverifikasi. Sample untuk bisnis, Bulk untuk order besar.</p>
            <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}><button onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})} style={{background:"#FF6A00",color:"#fff",border:"none",padding:"12px 20px",borderRadius:999,fontWeight:800,cursor:"pointer"}}>Shop Now →</button><span style={{fontSize:12,alignSelf:"center"}}>✓ Free Shipping $100+ • 1-Year Warranty • Secure Checkout</span></div>
          </div>
          <div style={{display:"flex",gap:10}}><img src={PRODUCTS[0].img} style={{width:140,height:170,objectFit:"cover",borderRadius:18}} alt="earbuds" /><img src={PRODUCTS[1].img} style={{width:140,height:170,objectFit:"cover",borderRadius:18}} alt="watch" /><img src={PRODUCTS[2].img} style={{width:140,height:170,objectFit:"cover",borderRadius:18}} alt="tote" /></div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:22}}><h2 id="products" style={{margin:0}}>Featured Products</h2><span style={{fontSize:13,color:"#666"}}>{filtered.length} products • Fee Voinnect 5% • Supplier 95%</span></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16,marginTop:14}}>
          {filtered.map(p=>(
            <div key={p.id} style={{background:"#fff",borderRadius:20,overflow:"hidden",boxShadow:"0 6px 20px rgba(0,0,0,0.07)"}}>
              <div style={{position:"relative"}}><img src={p.img} style={{width:"100%",height:190,objectFit:"cover",display:"block"}} alt={p.name} />{p.badge && <span style={{position:"absolute",top:10,left:10,background:"#FF6A00",color:"#fff",fontSize:11,padding:"4px 8px",borderRadius:999,fontWeight:800}}>{p.badge}</span>}</div>
              <div style={{padding:14}}>
                <div style={{fontSize:12,color:"#888"}}>{p.cat} • {p.supplier}</div>
                <div style={{fontWeight:800,fontSize:16,marginTop:4}}>{p.name}</div>
                <div style={{fontSize:13,marginTop:4}}>⭐ {p.rating} <span style={{color:"#888"}}>({p.reviews} reviews)</span></div><div style={{fontSize:12,color:"#666",marginTop:4}}>{p.origin} • 👁️ {p.views} views • ❤️ {p.picks} picks</div>
                <div style={{display:"flex",gap:8,alignItems:"baseline",marginTop:8}}><span style={{fontWeight:900,fontSize:20,color:"#FF6A00"}}>${p.price}.00</span>{p.old && <span style={{textDecoration:"line-through",color:"#999",fontSize:13}}>${p.old}</span>}</div>
                <div style={{display:"flex",gap:8,marginTop:10}}><button onClick={()=>add(p.id)} style={{flex:1,background:"#0A1A33",color:"#fff",border:"none",padding:"10px",borderRadius:999,fontWeight:800,cursor:"pointer"}}>Add to Cart</button><button onClick={()=>{setOrderType("Sample"); add(p.id); setShowCheckout(true);}} style={{background:"#fff",border:"1px solid #0A1A33",padding:"10px 12px",borderRadius:999,fontWeight:700,cursor:"pointer"}}>Sample</button></div>
              </div>
            </div>
          ))}
        </div>
        {showCart && (
          <div style={{position:"fixed",right:16,top:70,width:340,maxWidth:"calc(100vw - 32px)",background:"#fff",borderRadius:20,boxShadow:"0 20px 50px rgba(0,0,0,0.2)",padding:16,zIndex:50}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><b>Cart • {cartItems.length} items</b><button onClick={()=>setShowCart(false)} style={{border:"none",background:"transparent",cursor:"pointer",fontSize:18}}>×</button></div>
            {cartItems.length===0 ? <div style={{padding:20,textAlign:"center",color:"#888"}}>Keranjang masih kosong</div> : cartItems.map(p=>(
              <div key={p.id} style={{display:"flex",gap:10,alignItems:"center",marginTop:12}}><img src={p.img} style={{width:54,height:54,objectFit:"cover",borderRadius:12}} alt="" /><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{p.name}</div><div style={{color:"#FF6A00",fontWeight:800}}>${p.price}</div></div><button onClick={()=>setCart(cart.filter(id=>id!==p.id))} style={{border:"none",background:"#f1f1f1",borderRadius:999,padding:"4px 8px",cursor:"pointer"}}>🗑️</button></div>
            ))}
            {cartItems.length>0 && (<><div style={{display:"flex",gap:8,marginTop:14}}><button onClick={()=>setOrderType("Bulk")} style={{flex:1,padding:"9px",borderRadius:999,border:"none",background:orderType==="Bulk"?"#FF6A00":"#eee",color:orderType==="Bulk"?"#fff":"#333",fontWeight:800}}>Bulk Order</button><button onClick={()=>setOrderType("Sample")} style={{flex:1,padding:"9px",borderRadius:999,border:"none",background:orderType==="Sample"?"#0A1A33":"#eee",color:orderType==="Sample"?"#fff":"#333",fontWeight:800}}>Sample Bisnis</button></div>
            <div style={{fontSize:13,marginTop:12,lineHeight:1.8}}><div style={{display:"flex",justifyContent:"space-between"}}><span>Subtotal</span><b>${subtotal}.00</b></div><div style={{display:"flex",justifyContent:"space-between"}}><span>Platform Fee (5%)</span><b>${fee}</b></div><div style={{display:"flex",justifyContent:"space-between",fontSize:15}}><span>Total</span><b>${total}</b></div><div style={{color:"#666",fontSize:12}}>Supplier dapat 95% • Voinnect Fee 5% • Uang ditahan aman</div></div>
            <button onClick={()=>setShowCheckout(true)} style={{width:"100%",marginTop:10,background:"#FF6A00",color:"#fff",border:"none",padding:"12px",borderRadius:999,fontWeight:800,cursor:"pointer"}}>Proceed to Checkout →</button></>)}
          </div>
        )}
        {showCheckout && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:60,padding:12}}>
            <div style={{background:"#fff",borderRadius:22,maxWidth:520,width:"100%",padding:20,maxHeight:"90vh",overflow:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><h3 style={{margin:0}}>Checkout • {orderType==="Sample"?"Sample Bisnis":"Bulk Order"}</h3><button onClick={()=>setShowCheckout(false)} style={{border:"none",background:"transparent",fontSize:20,cursor:"pointer"}}>×</button></div>
              <p style={{fontSize:13,color:"#666"}}>Order ID: VM-88492 • Data ini nanti masuk ke Inbox Supplier sebagai Message, nyambung ke Account Supplier yang sudah isi.</p>
              <input placeholder="Nama Pembeli / Perusahaan" style={{width:"100%",padding:11,borderRadius:12,border:"1px solid #ddd",marginTop:8}} />
              <input placeholder="Alamat Kirim" style={{width:"100%",padding:11,borderRadius:12,border:"1px solid #ddd",marginTop:8}} />
              <input placeholder="Catatan: contoh - Tolong kirim sample 2 warna untuk presentasi" style={{width:"100%",padding:11,borderRadius:12,border:"1px solid #ddd",marginTop:8}} />
              <div style={{background:"#f6f7fb",borderRadius:14,padding:14,marginTop:12,fontSize:13,lineHeight:1.8}}><div style={{display:"flex",justifyContent:"space-between"}}><span>Subtotal</span><b>${subtotal}.00</b></div><div style={{display:"flex",justifyContent:"space-between"}}><span>Platform Fee (5%)</span><b>${fee}</b></div><div style={{display:"flex",justifyContent:"space-between",fontSize:16}}><span>Total</span><b>${total}</b></div><div style={{fontSize:12,color:"#666",marginTop:6}}>Supplier dapat 95% • Voinnect Fee 5% • Payment ditahan di escrow sampai barang sampai</div></div>
              <button onClick={()=>{alert("Virtual Checkout - Data masuk ke Inbox Supplier (VM-88492) - Nanti dikonekkan ke Supabase"); setShowCheckout(false); setShowCart(false);}} style={{width:"100%",marginTop:12,background:"#FF6A00",color:"#fff",border:"none",padding:"13px",borderRadius:999,fontWeight:800,cursor:"pointer"}}>Pay Now — ${total}</button>
              <div style={{textAlign:"center",fontSize:11,color:"#999",marginTop:10}}>Virtual dulu - Nanti dikonekkan ke Midtrans / Stripe + Supabase</div>
            </div>
          </div>
        )}
        <div style={{textAlign:"center",color:"#999",fontSize:12,marginTop:26}}>© Voinnect Market • Navy + Oren • Sign Out di Home / Dashboard saja, tidak di Market • Profil Supplier: Logo + Foto Personal + Keterangan</div>
      </div>
    </div>
  );
}
