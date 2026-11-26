import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { BookOpen, Search, Plus, Upload, FileText, Presentation, Image as ImageIcon, Download, Trash2, LogOut, LockKeyhole, FolderOpen, Clock3, X, ExternalLink, Layers3, CalendarDays, Check, Pencil, GraduationCap, ChevronRight } from "lucide-react";
import "./styles.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;
const ACCESS_PIN = "1029";
const WORKSPACE_OWNER_ID = "ead61e7c-19bc-462d-8055-90fd9768de26";
const starter = ["Fundamentos da Publicidade e Propaganda", "História Social dos Meios", "Filosofia e História das Ciências", "Oficina de Leitura e Produção Textual", "Informática Aplicada", "Ação Artística e Apreciação Estética"];

function readPageState() {
  const params = new URLSearchParams(window.location.search);
  return {
    active: params.get("pagina") || "Todas",
    semester: params.get("semestre") || "2026.1",
    query: params.get("busca") || ""
  };
}

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [password, setPassword] = useState("");
  const [semesters, setSemesters] = useState(["2026.1"]);
  const [activeSemester, setActiveSemester] = useState(() => readPageState().semester);
  const [addingSemester, setAddingSemester] = useState(false);
  const [newSemester, setNewSemester] = useState("");
  const [subjects, setSubjects] = useState(starter);
  const [docs, setDocs] = useState([]);
  const [active, setActive] = useState(() => readPageState().active);
  const [query, setQuery] = useState(() => readPageState().query);
  const [adding, setAdding] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [gradeData, setGradeData] = useState({ columns: [] });
  const [gradeLoading, setGradeLoading] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [activityType, setActivityType] = useState("Prova");

  // Mantém a página, o semestre e a busca na URL para continuar de onde parou após atualizar.
  useEffect(() => {
    const syncUrl = () => {
      const params = new URLSearchParams(window.location.search);
      if (active === "Todas") params.delete("pagina");
      else params.set("pagina", active);
      if (activeSemester === "2026.1") params.delete("semestre");
      else params.set("semestre", activeSemester);
      if (query) params.set("busca", query);
      else params.delete("busca");
      const next = window.location.pathname + (params.toString() ? "?" + params.toString() : "") + window.location.hash;
      window.history.replaceState({ ...window.history.state, luispp: true }, "", next);
    };
    syncUrl();
  }, [active, activeSemester, query]);

  useEffect(() => {
    const restoreFromUrl = () => {
      const page = readPageState();
      setActive(page.active);
      setActiveSemester(page.semester);
      setQuery(page.query);
    };
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, []);

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      setSession(data?.session ?? null);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setWorkspaceReady(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Registra o dispositivo no espaço compartilhado após validar o PIN.
  useEffect(() => {
    if (!session?.user?.id || !supabase) { setWorkspaceReady(false); return; }
    let cancelled = false;
    (async () => {
      const { error } = await supabase.rpc("join_workspace", { p_pin: ACCESS_PIN });
      if (cancelled) return;
      if (error) {
        setWorkspaceReady(false);
        setError("Não consegui validar o acesso ao espaço compartilhado: " + error.message);
        await supabase.auth.signOut();
        return;
      }
      setError("");
      setWorkspaceReady(true);
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id || !workspaceReady || !supabase) { setDocs([]); setSubjects(activeSemester === "2026.1" ? starter : []); return; }
    let cancelled = false;

    const refreshWorkspace = async () => {
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
    };

    setError("");
    refreshWorkspace();
    const channel = supabase
      .channel("luispp-workspace-sync-" + session.user.id + "-" + activeSemester)
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, refreshWorkspace)
      .on("postgres_changes", { event: "*", schema: "public", table: "subjects" }, refreshWorkspace)
      .on("postgres_changes", { event: "*", schema: "public", table: "semesters" }, refreshWorkspace)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, workspaceReady, activeSemester]);

  const login = async (e) => {
    e.preventDefault(); setError(""); setNotice("");
    if (!supabase) { setError("A conexão com o Supabase não está configurada."); return; }
    if (password !== ACCESS_PIN) { setError("Senha incorreta. Confira e tente novamente."); setPassword(""); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      setNotice("Validando seu espaço…"); setPassword("");
    } catch (e) { setError("Não foi possível abrir seu espaço. " + (e.message || "Confira se o acesso anônimo está habilitado no Supabase.")); }
    finally { setBusy(false); }
  };

  const addSemester = async (e) => {
    e.preventDefault();
    const name = newSemester.trim();
    if (!name || semesters.includes(name)) { setNewSemester(""); setAddingSemester(false); return; }
    const { error } = await supabase.from("semesters").insert({ name, user_id: WORKSPACE_OWNER_ID });
    if (error) { setError("Não consegui salvar o semestre: " + error.message); return; }
    setSemesters(prev => [...prev, name].sort((a,b)=>a.localeCompare(b,"pt-BR",{numeric:true})));
    setActiveSemester(name); setNewSemester(""); setAddingSemester(false); setNotice("Semestre " + name + " adicionado.");
  };

  const addSubject = async (e) => {
    e.preventDefault();
    const name = newSubject.trim();
    if (!name || subjects.includes(name)) { setNewSubject(""); setAdding(false); return; }
    const { error } = await supabase.from("subjects").upsert(
      { name, semester: activeSemester, user_id: WORKSPACE_OWNER_ID },
      { onConflict: "user_id,semester,name", ignoreDuplicates: true }
    );
    if (error) { setError("Não consegui salvar a matéria: " + error.message); return; }
    setSubjects(prev => [...new Set([...prev, name])].sort((a,b)=>a.localeCompare(b,"pt-BR")));
    setNotice("Matéria adicionada à lista.");
    setNewSubject(""); setAdding(false);
  };

  const emptyGradeData = { columns: [] };
  useEffect(() => {
    if (active === "Todas" || !workspaceReady || !supabase) { setGradeData(emptyGradeData); return; }
    let cancelled = false; setGradeLoading(true);
    (async () => {
      const { data, error } = await supabase.from("subjects").select("grade_data").eq("name", active).eq("semester", activeSemester).eq("user_id", WORKSPACE_OWNER_ID).maybeSingle();
      if (cancelled) return;
      if (error) setError("Não consegui carregar as notas: " + error.message);
      setGradeData(data?.grade_data && Array.isArray(data.grade_data.columns) ? data.grade_data : emptyGradeData);
      setGradeLoading(false);
    })();
    return () => { cancelled = true; };
  }, [active, activeSemester, workspaceReady]);
  const persistGradeData = async (next) => {
    setGradeData(next);
    const { error } = await supabase.from("subjects").upsert({ name: active, semester: activeSemester, user_id: WORKSPACE_OWNER_ID, grade_data: next }, { onConflict: "user_id,semester,name" });
    if (error) setError("Não consegui salvar as notas: " + error.message);
    else setNotice("Notas salvas automaticamente.");
  };
  const addActivity = async (e) => {
    e.preventDefault(); const name = activityName.trim(); if (!name) return;
    await persistGradeData({ ...gradeData, columns: [...gradeData.columns, { id: crypto.randomUUID(), name, type: activityType, score: "" }] });
    setActivityName(""); setActivityType("Prova");
  };
  const changeActivityScore = async (id, score) => persistGradeData({ ...gradeData, columns: gradeData.columns.map(c => c.id === id ? { ...c, score } : c) });
  const removeActivity = async (id) => persistGradeData({ ...gradeData, columns: gradeData.columns.filter(c => c.id !== id) });
  const gradeSum = gradeData.columns.reduce((sum, c) => sum + (c.score !== "" && Number.isFinite(Number(c.score)) ? Number(c.score) : 0), 0);
  const gradeFinal = gradeSum / 2;
  const gradeCount = gradeData.columns.filter(c => c.score !== "" && Number.isFinite(Number(c.score))).length;
  const passingGrade = 5.0;
  const hasGrades = gradeCount > 0;
  const passed = hasGrades && gradeFinal >= passingGrade;

  const addFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !session?.user) return;
    setUploading(true); setError(""); setNotice("");
    const added = [];
    try {
      for (const file of files) {
        const id = crypto.randomUUID();
        const path = WORKSPACE_OWNER_ID + "/" + id + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const { error: uploadError } = await supabase.storage.from("academic-files").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
        if (uploadError) throw uploadError;
        const subject = active === "Todas" ? "Sem matéria" : active;
        const row = { id, user_id: WORKSPACE_OWNER_ID, semester: activeSemester, title: file.name.replace(/\.[^.]+$/, ""), name: file.name, subject, description: "", storage_path: path, mime_type: file.type || "application/octet-stream", size_bytes: file.size };
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

  const renameDoc = async (doc) => {
    const suggested = doc.name || doc.title;
    const entered = window.prompt("Digite o novo nome do arquivo:", suggested);
    if (entered === null) return;
    const name = entered.trim();
    if (!name) { setError("O nome do arquivo não pode ficar vazio."); return; }
    if (name === doc.name) return;
    setError(""); setNotice("");
    const title = name.replace(/\.[^.]+$/, "");
    const { error } = await supabase.from("documents").update({ name, title }).eq("id", doc.id);
    if (error) { setError("Não consegui renomear o arquivo: " + error.message); return; }
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, name, title } : d));
    setNotice("Arquivo renomeado.");
  };

  const getUrl = async (doc) => {
    const { data, error } = await supabase.storage.from("academic-files").createSignedUrl(doc.path, 3600, { download: false });
    if (error) { setError("Não consegui abrir o arquivo: " + error.message); return; }
    const ext = (doc.name || "").split(".").pop().toLowerCase();
    const officeTypes = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];
    const target = officeTypes.includes(ext)
      ? "https://view.officeapps.live.com/op/view.aspx?src=" + encodeURIComponent(data.signedUrl)
      : data.signedUrl;
    const tab = window.open(target, "_blank", "noopener,noreferrer");
    if (!tab) setError("O navegador bloqueou a nova guia. Permita pop-ups para abrir arquivos.");
  };
  const visible = useMemo(() => docs.filter(d => d.semester === activeSemester && (active === "Todas" || d.subject === active) && [d.title,d.name,d.subject,d.description].join(" ").toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.createdAt-a.createdAt), [docs,active,activeSemester,query]);
  const fmt = n => n < 1024 ? n + " B" : n < 1048576 ? (n/1024).toFixed(0) + " KB" : (n/1048576).toFixed(1) + " MB";
  const fileIcon = d => d.mime.includes("image") ? <ImageIcon/> : d.mime.includes("pdf") || d.mime.includes("presentation") ? <Presentation/> : <FileText/>;

  if (!authReady) return <main className="login"><div className="login-card"><div className="brand-mark"><BookOpen size={26}/></div><h1>Luis<span>.pp</span></h1><p>Conectando ao seu espaço acadêmico…</p></div></main>;
  if (!session) return <main className="login"><div className="login-card"><div className="brand-mark"><BookOpen size={26}/></div><span className="eyebrow">SEU ESPAÇO ACADÊMICO</span><h1>Luis<span>.pp</span></h1><p>Seus trabalhos, suas ideias e suas matérias em um só lugar.</p><form onSubmit={login}><label htmlFor="password">Senha de acesso</label><input id="password" type="password" inputMode="numeric" autoComplete="current-password" maxLength={4} required placeholder="Digite sua senha" value={password} onChange={e=>setPassword(e.target.value)}/><button className="primary full" type="submit" disabled={busy}><LockKeyhole size={17}/>{busy ? "Abrindo seu espaço…" : "Entrar no Luis.pp"}</button>{error&&<p className="error">{error}</p>}{notice&&<p className="success">{notice}</p>}</form><small>Seu espaço acadêmico, organizado em um só lugar.</small></div></main>;

  return <div className="app"><aside className="sidebar"><button className={active==="Todas"?"nav active":"nav"} onClick={()=>setActive("Todas")}><FolderOpen size={18}/> Biblioteca de arquivos <span>{docs.filter(d=>d.semester===activeSemester).length}</span></button><button className={active==="Notas"?"nav active notes-nav":"nav notes-nav"} onClick={()=>setActive("Notas")}><GraduationCap size={18}/> Notas e médias <ChevronRight size={15}/></button><div className="side-heading">MINHAS MATÉRIAS <button onClick={()=>setAdding(!adding)} title="Adicionar matéria"><Plus size={16}/></button></div>{adding&&<form className="subject-form" onSubmit={addSubject}><input autoFocus value={newSubject} onChange={e=>setNewSubject(e.target.value)} placeholder="Nome da matéria"/><button aria-label="Salvar matéria"><Plus size={15}/></button></form>}<div className="subject-list">{subjects.map(s=><button key={s} className={active===s?"nav active":"nav"} onClick={()=>setActive(s)}><BookOpen size={16}/><span className="subject-name">{s}</span><span>{docs.filter(d=>d.semester===activeSemester && d.subject===s).length}</span></button>)}</div><div className="side-bottom"><button className="nav logout" onClick={async()=>{await supabase.auth.signOut();setActive("Todas");}}><LogOut size={17}/> Sair</button></div></aside><main className="content"><div className="topbar"><div className="page-brand"><div className="brand-mark"><BookOpen size={23}/></div><div><b>Luis<span>.pp</span></b><small>ESPAÇO ACADÊMICO</small></div></div><div className="semester-picker top-semester-picker"><CalendarDays size={17}/><select aria-label="Selecionar semestre" value={activeSemester} onChange={e=>{setActiveSemester(e.target.value);setActive("Todas");setQuery("");}}>{semesters.map(s=><option key={s} value={s}>{s}</option>)}</select><button title="Adicionar semestre" onClick={()=>setAddingSemester(!addingSemester)}><Plus size={16}/></button></div></div>{active === "Notas" ? <section className="notes-home"><div className="notes-home-heading"><span className="eyebrow">ACOMPANHAMENTO ACADÊMICO · {activeSemester}</span><h1>Notas e médias</h1><p>Escolha uma disciplina para consultar avaliações, lançar notas e acompanhar sua média.</p></div><div className="notes-intro"><div className="notes-intro-icon"><GraduationCap size={25}/></div><div><b>Seu desempenho, em um só lugar</b><span>A média mínima para aprovação é 5,0. As notas são salvas automaticamente.</span></div></div><div className="notes-subject-grid">{subjects.map((subject,index)=><button type="button" className="notes-subject-card" key={subject} onClick={()=>setActive(subject)}><span className="notes-card-icon"><BookOpen size={19}/></span><span className="notes-card-copy"><small>DISCIPLINA {String(index+1).padStart(2,"0")}</small><b>{subject}</b><em>Abrir boletim e lançar notas</em></span><span className="notes-card-arrow"><ChevronRight size={18}/></span></button>)}</div>{subjects.length===0&&<div className="empty"><h3>Nenhuma matéria cadastrada</h3><p>Adicione uma matéria para começar a acompanhar suas notas.</p></div>}<button className="notes-back-library" onClick={()=>setActive("Todas")}><FolderOpen size={16}/> Voltar à biblioteca de arquivos</button></section> : active !== "Todas" ? <section className="discipline-page">
      <div className="discipline-heading"><button className="back-link" onClick={() => setActive("Todas")}><FolderOpen size={16}/> Voltar à biblioteca</button><span className="eyebrow">DISCIPLINA · {activeSemester}</span><h1>{active}</h1><p>Organize suas avaliações e acompanhe seu desempenho nesta matéria.</p></div>
      {(error||notice)&&<div className={error?"notice":"notice success-notice"}><span>{error||notice}</span><button onClick={()=>{setError("");setNotice("");}}><X size={16}/></button></div>}<div className="grade-summary"><div><span>NOTA FINAL</span><strong>{gradeCount ? gradeFinal.toFixed(2).replace(".", ",") : "—"}</strong><small>Soma das notas ÷ 2</small></div><div><span>SITUAÇÃO</span><strong className={hasGrades ? passed ? "grade-status approved" : "grade-status failed" : "grade-status pending"}>{hasGrades ? passed ? "Aprovado" : "Reprovado" : "Aguardando"}</strong><small>{hasGrades ? passed ? "Você atingiu a média 5,0." : "Faltam " + (passingGrade-gradeFinal).toFixed(2).replace(".", ",") + " pontos para a média." : "Insira suas notas para calcular."}</small></div><div><span>AVALIAÇÕES LANÇADAS</span><strong>{gradeCount}<small> / {gradeData.columns.length}</small></strong><small>Notas preenchidas</small></div></div>
      <section className="grade-panel"><div className="grade-panel-title"><div><span className="eyebrow">ACOMPANHAMENTO ACADÊMICO</span><h2>Boletim de avaliações</h2><p>Adicione provas, trabalhos e outras atividades. O cálculo é atualizado automaticamente.</p></div><span className="grade-semester">{activeSemester}</span></div>
      <form className="activity-form" onSubmit={addActivity}><label>Nome da avaliação<input value={activityName} onChange={e=>setActivityName(e.target.value)} placeholder="Ex.: Prova 1, Trabalho em grupo..." required/></label><label>Tipo de atividade<select value={activityType} onChange={e=>setActivityType(e.target.value)}><option>Prova</option><option>Trabalho</option><option>Seminário</option><option>Atividade</option><option>Participação</option><option>Projeto</option><option>Outra</option></select></label><button className="primary" type="submit"><Plus size={16}/> Adicionar coluna</button></form>
      {gradeLoading ? <div className="grade-empty">Carregando suas notas…</div> : gradeData.columns.length === 0 ? <div className="grade-empty"><div className="empty-icon"><Layers3 size={25}/></div><b>Sua tabela ainda está vazia</b><p>Adicione a primeira avaliação para começar a acompanhar sua nota.</p></div> : <div className="grade-table-wrap"><table className="grade-table"><thead><tr><th>AVALIAÇÃO</th><th>TIPO</th><th>NOTA</th><th></th></tr></thead><tbody>{gradeData.columns.map(c=><tr key={c.id}><td className="grade-activity-name">{c.name}</td><td><span className="activity-type">{c.type}</span></td><td><input className="grade-input" type="number" min="0" step="0.01" placeholder="—" value={c.score} onChange={e=>setGradeData(prev=>({...prev,columns:prev.columns.map(item=>item.id===c.id?{...item,score:e.target.value}:item)}))} onBlur={e=>changeActivityScore(c.id,e.target.value)}/></td><td><button className="grade-remove" type="button" title="Excluir avaliação" onClick={()=>removeActivity(c.id)}><Trash2 size={15}/></button></td></tr>)}</tbody><tfoot><tr><td colSpan="2">NOTA FINAL · SOMA ÷ 2</td><td className="grade-final-cell">{gradeFinal.toFixed(2).replace(".", ",")}</td><td></td></tr></tfoot></table></div>}
      <div className="grade-rule"><Check size={16}/><span><b>Critério de aprovação:</b> a nota final é a soma de todas as notas preenchidas dividida por 2. A média mínima para aprovação é <b>5,0</b>. Com notas lançadas, a situação é atualizada automaticamente.</span></div></section>
      <section className="discipline-files"><div><h2>Materiais desta disciplina</h2><p>{visible.length} {visible.length===1?"arquivo":"arquivos"} armazenados neste semestre</p></div><label className="upload-btn"><Upload size={16}/>{uploading?"Enviando…":"Adicionar material"}<input type="file" multiple onChange={addFiles} hidden disabled={uploading}/></label></section>
      {visible.length ? <div className="file-grid">{visible.map(d=><article className="file-card" key={d.id}><div className="file-top"><div className="file-icon">{fileIcon(d)}</div><div className="file-tools"><button className="icon-btn rename" title="Renomear arquivo" onClick={()=>renameDoc(d)}><Pencil size={15}/></button><button className="icon-btn delete" title="Excluir arquivo" onClick={()=>removeDoc(d)}><Trash2 size={16}/></button></div></div><h3>{d.title}</h3><p className="filename">{d.name}</p><div className="file-actions"><button className="secondary" onClick={()=>getUrl(d)}><ExternalLink size={15}/> Abrir</button><button className="secondary square" onClick={()=>getUrl(d)}><Download size={16}/></button></div></article>)}</div> : <div className="empty"><p>Nenhum material foi adicionado a esta disciplina ainda.</p></div>}
    </section> : <><header><div><span className="eyebrow">BIBLIOTECA PESSOAL</span><h1>{active==="Todas"?"Meus trabalhos":active}</h1><p>Um lugar para guardar tudo o que você aprende.</p></div><label className="upload-btn"><Upload size={17}/>{uploading?"Enviando…":"Adicionar arquivo"}<input type="file" multiple onChange={addFiles} hidden disabled={uploading}/></label></header>{(error||notice)&&<div className={error?"notice":"notice success-notice"}><span>{error||notice}</span><button onClick={()=>{setError("");setNotice("");}}><X size={16}/></button></div>}<section className="toolbar"><div className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar trabalho, arquivo ou matéria..."/></div><span className="count">{visible.length} {visible.length===1?"arquivo":"arquivos"}</span></section>{addingSemester&&<form className="semester-form glass-panel" onSubmit={addSemester}><div><b>Novo semestre</b><span>Ex.: 2026.2 ou 2027.1</span></div><input autoFocus value={newSemester} onChange={e=>setNewSemester(e.target.value)} placeholder="2026.2" required/><button className="primary" type="submit"><Check size={15}/> Adicionar</button></form>}<div className="section-title"><div><h2>Arquivos recentes</h2><p>Os últimos materiais adicionados à sua biblioteca.</p></div><span className="recent"><Clock3 size={15}/> Atualizados recentemente</span></div>{visible.length===0?<div className="empty"><div className="empty-icon"><FolderOpen size={28}/></div><h3>{query?"Nenhum resultado encontrado":"Sua biblioteca começa aqui"}</h3><p>{query?"Tente buscar com outro termo.":"Adicione um arquivo da aula para ele aparecer aqui."}</p><label className="secondary upload-inline"><Plus size={16}/> Adicionar primeiro arquivo<input type="file" multiple hidden onChange={addFiles}/></label></div>:<div className="file-grid">{visible.map(d=><article className="file-card" key={d.id}><div className="file-top"><div className="file-icon">{fileIcon(d)}</div><div className="file-tools"><button className="icon-btn rename" title="Renomear arquivo" aria-label={"Renomear " + d.name} onClick={()=>renameDoc(d)}><Pencil size={15}/></button><button className="icon-btn delete" title="Excluir arquivo" aria-label={"Excluir " + d.name} onClick={()=>removeDoc(d)}><Trash2 size={16}/></button></div></div><h3 title={d.title}>{d.title}</h3><p className="filename">{d.name}</p><div className="file-meta"><span>{d.subject}</span><span>{d.semester} · {fmt(d.size)}</span></div><div className="file-actions"><button className="secondary" onClick={()=>getUrl(d)}><ExternalLink size={15}/> Abrir</button><button className="secondary square" title="Baixar" onClick={()=>getUrl(d)}><Download size={16}/></button></div></article>)}</div>}<footer>Luis.pp <span>·</span> Feito para acompanhar sua jornada acadêmica.</footer></> }</main></div>;
}
createRoot(document.getElementById("root")).render(<App/>);
