"use client";
import { useState } from "react";
export const dynamic = "force-dynamic";
// NEXT: Complete Registration - 1x isi, kepake di semua side. TIDAK merubah fungsi lain.
// Data ini nanti disimpan ke Supabase tabel profiles, dipakai di Chat/Meet/Hub/Feed/Circle/Market/Inbox
export default function CompleteProfile(){
  const [step,setStep] = useState(1);
  const [f,setF] = useState({name:"Johan Wijay",email:"wenyonghan927@gmail.com",phone:"",photo:"",company:"PT. Batik Solo Jaya",logo:"",desc:"Spesialis Batik Tulis Solo, sejak 2015, 50 pengrajin, ekspor ke 5 negara",category:"Fashion / Batik",country:"🇮🇩 Indonesia",type:"Keduanya (Buyer + Supplier)",lang:"🇮🇩 Indonesia"});
  const set = (k:string,v:string)=>setF({...f,[k]:v});
  const input = (label:string,k:string,ph:string)=> (<div style={{marginTop:12}}><div style={{fontSize:13,fontWeight:700,marginBottom:6}}>{label}</div><input value={(f as any)[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} style={{width:"100%",padding:"12px",borderRadius:12,border:"1px solid #ddd",fontSize:14}} /></div>);
  return (
    <div style={{background:"linear-gradient(180deg,#F7F8FC,#EEF1F7)",minHeight:"100vh",fontFamily:"system-ui",padding:16}}>
      <div style={{maxWidth:620,margin:"0 auto"}}>
        <div style={{background:"#0A1A33",color:"#fff",borderRadius:24,padding:20}}>
          <div style={{fontWeight:900,fontSize:22}}>VN<span style={{color:"#FF6A00"}}>ECT</span> <span style={{fontSize:12,background:"#FF6A00",padding:"2px 8px",borderRadius:999}}>LENGKAPI PROFIL</span></div>
          <p style={{fontSize:13,opacity:0.85,margin:"8px 0 0"}}>1x isi di awal — otomatis muncul di Chat, Meet, Hub, Business Feed, Circle, Market & Inbox Supplier. Fungsi lain tidak dirubah.</p>
          <div style={{display:"flex",gap:8,marginTop:14}}>{[1,2,3].map(n=>(<div key={n} style={{flex:1,textAlign:"center",padding:"8px",borderRadius:999,background:step===n?"#FF6A00":"rgba(255,255,255,0.15)",fontSize:12,fontWeight:800}}>{n===1?"1. Data Person":n===2?"2. Data Company":"3. Akun"}</div>))}</div>
        </div>
        <div style={{background:"#fff",borderRadius:24,padding:20,marginTop:14,boxShadow:"0 10px 28px rgba(10,26,51,0.10)"}}>
          {step===1 && (<><h3 style={{margin:0}}>Data Person</h3>{input("Nama Lengkap","name","Johan Wijay")}{input("Email","email","email")}{input("No. WA / Telepon","phone","+62 ...")}
            <div style={{marginTop:12}}><div style={{fontSize:13,fontWeight:700,marginBottom:6}}>Foto Personal (bulat, muncul di Chat / Meet / Circle)</div><div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{width:56,height:56,borderRadius:"50%",background:"#0A1A33",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20}}>J</div><button style={{padding:"10px 14px",borderRadius:999,border:"1px solid #0A1A33",background:"#fff",cursor:"pointer",fontWeight:700}}>📷 Upload Foto Personal</button></div><div style={{fontSize:12,color:"#888",marginTop:6}}>Preview: Foto ini yang muncul di Chat, Meet, Circle.</div></div>
            <button onClick={()=>setStep(2)} style={{width:"100%",marginTop:16,background:"#FF6A00",color:"#fff",border:"none",padding:"13px",borderRadius:999,fontWeight:800,cursor:"pointer"}}>Lanjut ke Data Company →</button></>)}
          {step===2 && (<><h3 style={{margin:0}}>Data Company</h3>{input("Nama Company","company","PT. Batik Solo Jaya")}
            <div style={{marginTop:12}}><div style={{fontSize:13,fontWeight:700,marginBottom:6}}>Logo Company (kotak, muncul di Market / Feed / Inbox)</div><div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{width:56,height:56,borderRadius:14,background:"#0A1A33",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>BSJ</div><button style={{padding:"10px 14px",borderRadius:999,border:"1px solid #0A1A33",background:"#fff",cursor:"pointer",fontWeight:700}}>🏢 Upload Logo Company</button></div></div>
            <div style={{marginTop:12}}><div style={{fontSize:13,fontWeight:700,marginBottom:6}}>Keterangan / Deskripsi Company</div><textarea value={f.desc} onChange={e=>set("desc",e.target.value)} rows={3} style={{width:"100%",padding:"12px",borderRadius:12,border:"1px solid #ddd",fontSize:14}} /></div>
            {input("Kategori","category","Fashion / Batik")}{input("Negara","country","🇮🇩 Indonesia")}
            <div style={{display:"flex",gap:10,marginTop:16}}><button onClick={()=>setStep(1)} style={{flex:1,padding:"13px",borderRadius:999,border:"1px solid #ddd",background:"#fff",cursor:"pointer",fontWeight:700}}>← Kembali</button><button onClick={()=>setStep(3)} style={{flex:1,background:"#FF6A00",color:"#fff",border:"none",padding:"13px",borderRadius:999,fontWeight:800,cursor:"pointer"}}>Lanjut ke Akun →</button></div></>)}
          {step===3 && (<><h3 style={{margin:0}}>Akun</h3><div style={{marginTop:12}}><div style={{fontSize:13,fontWeight:700,marginBottom:6}}>Tipe Akun</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["Buyer","Supplier","Keduanya (Buyer + Supplier)"].map(t=>(<button key={t} onClick={()=>set("type",t)} style={{padding:"10px 14px",borderRadius:999,border:"none",background:f.type===t?"#0A1A33":"#eee",color:f.type===t?"#fff":"#333",fontWeight:700,cursor:"pointer"}}>{t}</button>))}</div></div>
            <div style={{marginTop:12}}><div style={{fontSize:13,fontWeight:700,marginBottom:6}}>Bahasa</div><div style={{display:"flex",gap:8}}>{["🇮🇩 Indonesia","🇺🇸 English","🇨🇳 中文","🇯🇵 日本語","🇰🇷 한국어"].map(l=>(<button key={l} onClick={()=>set("lang",l)} style={{padding:"10px 12px",borderRadius:999,border:"none",background:f.lang===l?"#FF6A00":"#eee",color:f.lang===l?"#fff":"#333",fontWeight:700,cursor:"pointer"}}>{l}</button>))}</div></div>
            <div style={{background:"#FFF7ED",borderRadius:14,padding:14,marginTop:16,fontSize:13,lineHeight:1.7}}><b>Preview — Yang akan muncul di semua side:</b><br/>👤 {f.name} • 🏢 {f.company} • {f.country}<br/>Logo: BSJ • Foto: J • {f.desc}<br/>Tipe: {f.type} • Bahasa: {f.lang}</div>
            <div style={{display:"flex",gap:10,marginTop:16}}><button onClick={()=>setStep(2)} style={{flex:1,padding:"13px",borderRadius:999,border:"1px solid #ddd",background:"#fff",cursor:"pointer",fontWeight:700}}>← Kembali</button><button onClick={()=>alert("Tersimpan (Virtual) - Nanti dikonekkan ke Supabase profiles. Data ini akan muncul di Chat/Meet/Hub/Feed/Circle/Market/Inbox.")} style={{flex:1,background:"#FF6A00",color:"#fff",border:"none",padding:"13px",borderRadius:999,fontWeight:800,cursor:"pointer"}}>✅ Simpan & Selesai</button></div></>)}
          <div style={{textAlign:"center",fontSize:11,color:"#999",marginTop:14}}>Login / Register tidak disentuh — ini hanya Lengkapi Profil setelah login. Fungsi lain tetap.</div>
        </div>
      </div>
    </div>
  );
}
