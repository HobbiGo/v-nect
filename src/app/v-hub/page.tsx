Skip to content

Find

Overview
Deployments
CI
Logs
Traces
Analytics
Speed Insights
Observability
Firewall
CDN
Environment Variables
Domains
Connect
Integrations
Storage
Flags
Agent
Vulnerabilities
AI Gateway
Sandboxes
Workflows
Images
Drives
Daemons
Usage
Support
Settings
Enable 2FA
Help protect your Vercel account from unauthorized access with two-factor authentication.

Avatar for wenyonghan927-5614
wenyonghan927-5614


Deployments
B1nDeQJGp

Deployment
Logs
Resources
Source
Open Graph
Deployment Details
Build Failed
Command "npm run build" exited with 1
Created
github/HobbiGo
HobbiGo
3m ago
Status
Error
Stale
Duration
11s
3m ago
Environment
Production
Domains
voinnect-git-main-orbiss.vercel.app
voinnect-9npdk3cj…orbiss.vercel.app
Source
main
aef438a
Update page.tsx

Deployment Settings
2 Recommendations
Build Logs
11s
44 error lines

4

2
Find in logs
Ctrl
F
 83 | <section id="hub-follow-section" className="tk-section"><div className="tk-sec-head"><h2>Follow Profiles & Workspaces</h2><div className="tk-chips"><button className={followFilter==="all"?"on":""} onClick={()=>setFollowFilter("all")}>All ({followableEntities.length})</button><button className={followFilter==="company"?"on":""} onClick={()=>setFollowFilter("company")}>Company</button><button className={followFilter==="personal"?"on":""} onClick={()=>setFollowFilter("personal")}>Personal</button></div></div><div className="tk-follow-grid">{filteredFollowables.map((item)=>{const isF=followedIds.includes(item.id);return(<article className="tk-follow" key={item.id}><div className="tk-follow-top"><span className="tk-badge">{item.entityType==="company"?"COMPANY":"PERSONAL"}</span><small>{item.handle}</small></div><div className="tk-follow-ava">{item.name.charAt(0)}</div><h3>{item.name}</h3><p>{item.subtitle}</p><div className="tk-follow-actions"><button className={isF?"tk-joined":"tk-primary"} onClick={()=>toggleFollowEntity(item)}>{isF?"Following ✓":"+ Follow"}</button><Link href={item.destinationHref} className="tk-ghost">{item.destinationLabel}</Link></div></article>);})}</div></section>
 84 | <section id="hub-activity-section" className="tk-section"><h2>Recent Ecosystem Activity</h2><div className="tk-two"><div className="tk-card2"><span className="tk-eyebrow">PUBLISHED BUSINESS POSTS</span><h3>Latest Feed Activity</h3>{recentPosts.length===0?(<p className="tk-muted">Belum ada aktivitas post terbaru.</p>):(<ul className="tk-list">{recentPosts.map((post)=>(<li key={post.id}><b>{post.title}</b><small>{post.companies?.company_name||"Company"} · {post.post_type}</small></li>))})}<Link href="/business-feed" className="tk-ghost">Lihat Semua Post di Feed →</Link></div><div className="tk-card2"><span className="tk-eyebrow">YOUR SESSION & FOLLOW LOG</span><h3>Recent Hub Actions</h3><ul className="tk-list">{activityLog.map((e,i)=>(<li key={`${e}-${i}`}><span>{e}</span></li>))}</ul></div></div></section>
    :                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ^^^^^^^^^
 85 | {showEditSheet&&(<div className="tk-overlay"><div className="tk-sheet"><div className="tk-sheet-bar"/><b>Edit Hub Headline & Focus</b><form onSubmit={handleSaveIdentity} className="tk-form"><label>Headline<input value={identityNote.headline} onChange={(e)=>setIdentityNote((p)=>({...p,headline:e.target.value}))} maxLength={140}/></label><label>Summary<textarea rows={3} value={identityNote.summary} onChange={(e)=>setIdentityNote((p)=>({...p,summary:e.target.value}))} maxLength={400}/></label><label>Core Focus Areas<input value={identityNote.focusAreas} onChange={(e)=>setIdentityNote((p)=>({...p,focusAreas:e.target.value}))} maxLength={180}/></label><button className="tk-primary" type="submit" disabled={savingIdentity}>{savingIdentity?"Menyimpan...":"Simpan Ringkasan Hub"}</button><button type="button" className="tk-ghost" onClick={()=>setShowEditSheet(false)}>Batal</button></form></div></div>)}
 86 | <nav className="tk-bottom"><Link href="/">⌂<small>Home</small></Link><Link href="/explore">🔍<small>Explore</small></Link><Link href="/business-feed" className="tk-plus">+<small>Post</small></Link><Link href="/v-circle">👥<small>Circle</small></Link><Link href="/v-hub" className="on">◎<small>v-hub</small></Link></nav>
 87 | <footer className="tk-footer">v-nect v-hub · {currentUserId?`Signed in as ${currentUserName}${dbSyncActive?" (Supabase Sync Active)":" (Local Sync)"}`:"Public Preview"} · © {new Date().getFullYear()} v-nect</footer>
    `----
Caused by:
    Syntax Error
Import trace for requested module:
./src/app/v-hub/page.tsx
> Build failed because of webpack errors
Error: [BUILD_UTILS_SPAWN_1] Command "npm run build" exited with 1
Deployment Summary
Deployment Checks
Assigning Custom Domains
Runtime Logs

View and debug runtime logs & errors

Observability

Monitor app health & performance

Speed Insights

Not Enabled
Performance metrics from real users

Web Analytics

Not Enabled
Analyze visitors & traffic in real-time

Deployments
