import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { BookOpen, Search, Plus, Upload, FileText, Presentation, Image as ImageIcon, Download, Trash2, LogOut, LockKeyhole, FolderOpen, Clock3, X, ExternalLink, Layers3, CalendarDays, Check } from "lucide-react";
import "./styles.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;
const ACCESS_PIN = "1029";
const starter = ["Fundamentos da Publicidade e Propaganda", "História Social dos Meios", "Filosofia e História das Ciências", "Oficina de Leitura e Produção Textual", "Informática Aplicada", "Ação Artística e Apreciação Estética"];

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [password, setPassword] = useState("");
  const [semesters, setSemesters] = useState(["2026.1"]);
  const [activeSemester, setActiveSemester] = useState("2026.1");
  const [addingSemester, setAddingSemester] = useState(false);
  const [newSemester, setNewSemester] = useState("");
  const [subjects, setSubjects] = useState(starter);
  const [docs, setDocs] = useState([]);
  const [active, setActive] = useState("Todas");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      setSession(data?.session ?? null);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id || !supabase) { setDocs([]); setSubjects(activeSemester === "2026.1" ? starter : []); return; }
    let cancelled = false;
    (async () => {
      setError("");
      const [subjectResult, docResult, semesterResult] = await Promise.all([
        supabase.from("subjects").select("id,name,semester").eq("semester", activeSemester).order("name"),
        supabase.from("documents").select("id,title,name,subject,semester,description,storage_path,mime_type,size_bytes,created_at").order("created_at", { ascending: false }),
        supabase.from("semesters").select("id,name").order("name")
      ]);
      if (cancelled) return;
      if (subjectResult.error) setError("Não consegui carregar as matérias: " + subjectResult.error.message);
      else setSubjects([...new Set([...(activeSemester === "2026.1" ? starter : []), ...(subjectResult.data || []).map(s => s.name)])]);
      if (docResult.error) setError("Não consegui carregar os arquivos: " + docResult.error.message);
      else setDocs((docResult.data || []).map(d => ({ id:d.id, title:d.title, name:d.name, subject:d.subject, semester:d.semester || "2026.1", description:d.description, path:d.storage_path, mime:d.mime_type, size:Number(d.size_bytes), createdAt:new Date(d.created_at).getTime() })));
      if (semesterResult.error) setError("Não consegui carregar os semestres: " + semesterResult.error.message);
      else { const list = [...new Set(["2026.1", ...(semesterResult.data || []).map(s => s.name)])]; setSemesters(list); setActiveSemester(current => list.includes(current) ? current : list[0]); }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id, activeSemester]);

  const login = async (e) => {
    e.preventDefault(); setError(""); setNotice("");
    if (!supabase) { setError("A conexão com o Supabase não está configurada."); return; }
    if (password !== ACCESS_PIN) { setError("Senha incorreta. Confira e tente novamente."); setPassword(""); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      setNotice("Acesso liberado."); setPassword("");
    } catch (e) { setError("Não foi possível abrir seu espaço. " + (e.message || "Confira se o acesso anônimo está habilitado no Supabase.")); }
    finally { setBusy(false); }
  };

  const addSemester = async (e) => {
    e.preventDefault();
    const name = newSemester.trim();
    if (!name || semesters.includes(name)) { setNewSemester(""); setAddingSemester(false); return; }
    const { error } = await supabase.from("semesters").insert({ name, user_id: session.user.id });
    if (error) { setError("Não consegui salvar o semestre: " + error.message); return; }
    setSemesters(prev => [...prev, name].sort((a,b)=>a.localeCompare(b,"pt-BR",{numeric:true})));
    setActiveSemester(name); setNewSemester(""); setAddingSemester(false); setNotice("Semestre " + name + " adicionado.");
  };

  const addSubject = async (e) => {
    e.preventDefault();
    const name = newSubject.trim();
    if (!name || subjects.includes(name)) { setNewSubject(""); setAdding(false); return; }
    const { error } = await supabase.from("subjects").insert({ name, semester: activeSemester, user_id: session.user.id });
    if (error) { setError("Não consegui salvar a matéria: " + error.message); return; }
    setSubjects(prev => [...prev, name].sort((a,b)=>a.localeCompare(b,"pt-BR")));
    setNewSubject(""); setAdding(false);
  };

  const addFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !session?.user) return;
    setUploading(true); setError(""); setNotice("");
    const added = [];
    try {
      for (const file of files) {
        const id = crypto.randomUUID();
        const path = session.user.id + "/" + id + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const { error: uploadError } = await supabase.storage.from("academic-files").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
        if (uploadError) throw uploadError;
        const subject = active === "Todas" ? "Sem matéria" : active;
        const row = { id, user_id: session.user.id, semester: activeSemester, title: file.name.replace(/\.[^.]+$/, ""), name: file.name, subject, description: "", storage_path: path, mime_type: file.type || "application/octet-stream", size_bytes: file.size };
        const { data, error: insertError } = await supabase.from("documents").insert(row).select("id,title,name,subject,description,storage_path,mime_type,size_bytes,created_at").single();
        if (insertError) {
          await supabase.storage.from("academic-files").remove([path]);
          throw insertError;
        }
        added.push({ id:data.id, title:data.title, name:data.name, subject:data.subject, description:data.description, path:data.storage_path, mime:data.mime_type, size:Number(data.size_bytes), createdAt:new Date(data.created_at).getTime() });
      }
      setDocs(prev => [...added, ...prev].sort((a,b)=>b.createdAt-a.createdAt));
      if (added.length) setNotice(added.length + (added.length === 1 ? " arquivo enviado para sua biblioteca." : " arquivos enviados para sua biblioteca."));
    } catch (e) { setError("Falha ao enviar arquivo. " + (e.message || "Verifique o bucket e as permissões do Supabase.")); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const removeDoc = async (doc) => {
    if (!confirm("Excluir este arquivo da biblioteca? Esta ação não pode ser desfeita.")) return;
    setError(""); setNotice("");
    const { error: storageError } = await supabase.storage.from("academic-files").remove([doc.path]);
    if (storageError) { setError("Não consegui excluir o arquivo: " + storageError.message); return; }
    const { error: rowError } = await supabase.from("documents").delete().eq("id", doc.id);
    if (rowError) { setError("Arquivo removido do armazenamento, mas o registro não pôde ser apagado: " + rowError.message); return; }
    setDocs(prev => prev.filter(d => d.id !== doc.id));
  };

  const getUrl = async (doc) => {
    const { data, error } = await supabase.storage.from("academic-files").createSignedUrl(doc.path, 60);
    if (error) { setError("Não consegui abrir o arquivo: " + error.message); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };
  const visible = useMemo(() => docs.filter(d => d.semester === activeSemester && (active === "Todas" || d.subject === active) && [d.title,d.name,d.subject,d.description].join(" ").toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.createdAt-a.createdAt), [docs,active,activeSemester,query]);
  const fmt = n => n < 1024 ? n + " B" : n < 1048576 ? (n/1024).toFixed(0) + " KB" : (n/1048576).toFixed(1) + " MB";
  const fileIcon = d => d.mime.includes("image") ? <ImageIcon/> : d.mime.includes("pdf") || d.mime.includes("presentation") ? <Presentation/> : <FileText/>;

  if (!authReady) return <main className="login"><div className="login-card"><div className="brand-mark"><BookOpen size={26}/></div><h1>Luis<span>.pp</span></h1><p>Conectando ao seu espaço acadêmico…</p></div></main>;
  if (!session) return <main className="login"><div className="login-card"><div className="brand-mark"><BookOpen size={26}/></div><span className="eyebrow">SEU ESPAÇO ACADÊMICO</span><h1>Luis<span>.pp</span></h1><p>Seus trabalhos, suas ideias e suas matérias em um só lugar.</p><form onSubmit={login}><label htmlFor="password">Senha de acesso</label><input id="password" type="password" inputMode="numeric" autoComplete="current-password" maxLength={4} required placeholder="Digite sua senha" value={password} onChange={e=>setPassword(e.target.value)}/><button className="primary full" type="submit" disabled={busy}><LockKeyhole size={17}/>{busy ? "Abrindo seu espaço…" : "Entrar no Luis.pp"}</button>{error&&<p className="error">{error}</p>}{notice&&<p className="success">{notice}</p>}</form><small>Seu espaço acadêmico, organizado em um só lugar.</small></div></main>;

  return <div className="app"><aside className="sidebar"><button className={active==="Todas"?"nav active":"nav"} onClick={()=>setActive("Todas")}><FolderOpen size={18}/> Trabalhos do semestre <span>{docs.filter(d=>d.semester===activeSemester).length}</span></button><div className="side-heading">MINHAS MATÉRIAS <button onClick={()=>setAdding(!adding)} title="Adicionar matéria"><Plus size={16}/></button></div>{adding&&<form className="subject-form" onSubmit={addSubject}><input autoFocus value={newSubject} onChange={e=>setNewSubject(e.target.value)} placeholder="Nome da matéria"/><button aria-label="Salvar matéria"><Plus size={15}/></button></form>}<div className="subject-list">{subjects.map(s=><button key={s} className={active===s?"nav active":"nav"} onClick={()=>setActive(s)}><BookOpen size={16}/><span className="subject-name">{s}</span><span>{docs.filter(d=>d.semester===activeSemester && d.subject===s).length}</span></button>)}</div><div className="side-bottom"><div className="tip"><div className="tip-icon">✦</div><b>Um semestre de cada vez.</b><p>Organize seus materiais e deixe tudo pronto para a próxima aula.</p></div><button className="nav logout" onClick={async()=>{await supabase.auth.signOut();setActive("Todas");}}><LogOut size={17}/> Sair</button></div></aside><main className="content"><div className="topbar"><div className="page-brand"><div className="brand-mark"><BookOpen size={23}/></div><div><b>Luis<span>.pp</span></b><small>ESPAÇO ACADÊMICO</small></div></div><div className="semester-picker top-semester-picker"><CalendarDays size={17}/><select aria-label="Selecionar semestre" value={activeSemester} onChange={e=>{setActiveSemester(e.target.value);setActive("Todas");setQuery("");}}>{semesters.map(s=><option key={s} value={s}>{s}</option>)}</select><button title="Adicionar semestre" onClick={()=>setAddingSemester(!addingSemester)}><Plus size={16}/></button></div></div><header><div><span className="eyebrow">BIBLIOTECA PESSOAL</span><h1>{active==="Todas"?"Meus trabalhos":active}</h1><p>Um lugar para guardar tudo o que você aprende.</p></div><label className="upload-btn"><Upload size={17}/>{uploading?"Enviando…":"Adicionar arquivo"}<input type="file" multiple onChange={addFiles} hidden disabled={uploading}/></label></header>{(error||notice)&&<div className={error?"notice":"notice success-notice"}><span>{error||notice}</span><button onClick={()=>{setError("");setNotice("");}}><X size={16}/></button></div>}<section className="toolbar"><div className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar trabalho, arquivo ou matéria..."/></div><span className="count">{visible.length} {visible.length===1?"arquivo":"arquivos"}</span></section>{addingSemester&&<form className="semester-form glass-panel" onSubmit={addSemester}><div><b>Novo semestre</b><span>Ex.: 2026.2 ou 2027.1</span></div><input autoFocus value={newSemester} onChange={e=>setNewSemester(e.target.value)} placeholder="2026.2" required/><button className="primary" type="submit"><Check size={15}/> Adicionar</button></form>}<div className="section-title"><div><h2>Arquivos recentes</h2><p>Os últimos materiais adicionados à sua biblioteca.</p></div><span className="recent"><Clock3 size={15}/> Atualizados recentemente</span></div>{visible.length===0?<div className="empty"><div className="empty-icon"><FolderOpen size={28}/></div><h3>{query?"Nenhum resultado encontrado":"Sua biblioteca começa aqui"}</h3><p>{query?"Tente buscar com outro termo.":"Adicione um arquivo da aula para ele aparecer aqui."}</p><label className="secondary upload-inline"><Plus size={16}/> Adicionar primeiro arquivo<input type="file" multiple hidden onChange={addFiles}/></label></div>:<div className="file-grid">{visible.map(d=><article className="file-card" key={d.id}><div className="file-top"><div className="file-icon">{fileIcon(d)}</div><button className="icon-btn delete" title="Excluir arquivo" onClick={()=>removeDoc(d)}><Trash2 size={16}/></button></div><h3 title={d.title}>{d.title}</h3><p className="filename">{d.name}</p><div className="file-meta"><span>{d.subject}</span><span>{d.semester} · {fmt(d.size)}</span></div><div className="file-actions"><button className="secondary" onClick={()=>getUrl(d)}><ExternalLink size={15}/> Abrir</button><button className="secondary square" title="Baixar" onClick={()=>getUrl(d)}><Download size={16}/></button></div></article>)}</div>}<footer>Luis.pp <span>·</span> Feito para acompanhar sua jornada acadêmica.</footer></main></div>;
}
createRoot(document.getElementById("root")).render(<App/>);
