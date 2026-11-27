import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { BookOpen, Search, Plus, Upload, FileText, Presentation, Image as ImageIcon, Download, Trash2, LogOut, LockKeyhole, FolderOpen, Clock3, X, ExternalLink, Layers3, CalendarDays, Check, Pencil, GraduationCap, ChevronRight, ChevronLeft, CalendarCheck, ListTodo, Circle, CheckCircle2, StickyNote } from "lucide-react";
import "./styles.css";
import PlannerDetails from "./PlannerDetails";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;
const ACCESS_PIN = "1029";
const WORKSPACE_OWNER_ID = "ead61e7c-19bc-462d-8055-90fd9768de26";
const starter = ["Fundamentos da Publicidade e Propaganda", "História Social dos Meios", "Filosofia e História das Ciências", "Oficina de Leitura e Produção Textual", "Informática Aplicada", "Ação Artística e Apreciação Estética"];

function localDateKey(date = new Date()) { return [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-"); }

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
  const [attendanceData,setAttendanceData]=useState({records:[]});
  const [attendanceDate,setAttendanceDate]=useState(()=>localDateKey());
  const [attendanceStatus,setAttendanceStatus]=useState("Presente");
  const [attendanceNote,setAttendanceNote]=useState("");
  const [attendanceSaving,setAttendanceSaving]=useState(false);
  const [attendanceDay,setAttendanceDay]=useState("1");
  const [attendanceStart,setAttendanceStart]=useState("19:00");
  const [attendanceEnd,setAttendanceEnd]=useState("20:40");
  const [attendanceUnits,setAttendanceUnits]=useState("1");
  const [attendanceMax,setAttendanceMax]=useState("16");
  const [attendanceRecordUnits,setAttendanceRecordUnits]=useState("1");
  const [attendanceSettingsOpen,setAttendanceSettingsOpen]=useState(false);
  const [activityName, setActivityName] = useState("");
  const [activityType, setActivityType] = useState("Prova");
  const [plannerItems,setPlannerItems]=useState([]);
  const [plannerTitle,setPlannerTitle]=useState("");
  const [plannerCategory,setPlannerCategory]=useState("Prova");
  const [plannerDate,setPlannerDate]=useState(()=>localDateKey());
  const [plannerTime,setPlannerTime]=useState("");
  const [plannerSubject,setPlannerSubject]=useState("");
  const [plannerDescription,setPlannerDescription]=useState("");
  const [plannerLoading,setPlannerLoading]=useState(false);
  const [plannerMonth,setPlannerMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
  const [plannerSelectedDay,setPlannerSelectedDay]=useState(()=>{try{return localStorage.getItem("luispp-planner-day")||localDateKey();}catch{return localDateKey();}});
  const [plannerDayWasSaved]=useState(()=>{try{return Boolean(localStorage.getItem("luispp-planner-day"));}catch{return false;}});
  const [selectedPlannerItem,setSelectedPlannerItem]=useState(null);
  const [noticeItems,setNoticeItems]=useState([]);
  const [noticeTitle,setNoticeTitle]=useState("");
  const [noticeBody,setNoticeBody]=useState("");
  const [noticeKind,setNoticeKind]=useState("Anotação");
  const [noticeSubject,setNoticeSubject]=useState("");
  const [noticeDate,setNoticeDate]=useState("");
  const [noticeSearch,setNoticeSearch]=useState("");
  const [noticeFilter,setNoticeFilter]=useState("Todas");
  const [noticeLoading,setNoticeLoading]=useState(false);
  const [activityMaxScore,setActivityMaxScore]=useState("10");
  const [editRecord,setEditRecord]=useState(null);
  const [editForm,setEditForm]=useState({});
  const [editSaving,setEditSaving]=useState(false);
  const [plannerNotify,setPlannerNotify]=useState({enabled:false,mode:"once",offset_minutes:1440,days:[],times:["08:00"]});
  const [noticeNotify,setNoticeNotify]=useState({enabled:false,mode:"once",offset_minutes:1440,days:[],times:["08:00"]});
  const [pushStatus,setPushStatus]=useState("off");
  const [pushBusy,setPushBusy]=useState(false);
  const [installPrompt,setInstallPrompt]=useState(null);
  const [isInstalled,setIsInstalled]=useState(()=>window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);
  useEffect(()=>{
    const onBeforeInstall=(event)=>{event.preventDefault();setInstallPrompt(event);};
    const onInstalled=()=>{setIsInstalled(true);setInstallPrompt(null);setNotice("Luis.pp instalado no seu celular.");};
    window.addEventListener("beforeinstallprompt",onBeforeInstall);
    window.addEventListener("appinstalled",onInstalled);
    return()=>{window.removeEventListener("beforeinstallprompt",onBeforeInstall);window.removeEventListener("appinstalled",onInstalled);};
  },[]);
  const installApp=async()=>{
    if(installPrompt){await installPrompt.prompt();const choice=await installPrompt.userChoice;if(choice?.outcome==="accepted")setNotice("Instalação do Luis.pp iniciada.");setInstallPrompt(null);return;}
    setNotice("Para instalar: abra este endereço no Google Chrome, toque nos três pontinhos e escolha Instalar aplicativo ou Adicionar à tela inicial. Se estiver no WhatsApp, abra primeiro no Chrome.");
  };
  const enablePush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !supabase) { setError("Este navegador não oferece suporte a notificações push."); return; }
    setPushBusy(true); setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Permissão de notificações não concedida.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();
      const vapidPublicKey = "BPpVsfvvXpE8a5Q9Xgy5BqRSVD6Q-QtWj0X7W-ZSFMKO4m3Q8l2ztDFcPtkzjKPw3dFUgxeamgzk7W5uEwGneSE";
      const applicationServerKey = Uint8Array.from(atob(vapidPublicKey.replace(/-/g,"+").replace(/_/g,"/") + "=".repeat((4-vapidPublicKey.length%4)%4)), ch => ch.charCodeAt(0));
      const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey });
      const json = subscription.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert({ user_id:session.user.id, endpoint:json.endpoint, p256dh:json.keys.p256dh, auth:json.keys.auth, expiration_time:json.expirationTime }, { onConflict:"endpoint" });
      if (error) throw error;
      setPushStatus("on"); setNotice("Notificações ativadas neste dispositivo.");
    } catch (e) { setError(e.message || "Não foi possível ativar as notificações."); }
    finally { setPushBusy(false); }
  };


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

  // Anima os elementos conforme entram na área visível durante a rolagem.
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const selector = ".content > header, .toolbar, .section-title, .file-card, .discipline-heading, .grade-summary, .attendance-panel, .grade-panel, .discipline-files, .notes-home-heading, .notes-intro, .notes-subject-card, .planner-heading, .planner-overview > div, .planner-layout > .panel, .planner-list-heading, .planner-item";
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => element.classList.add("scroll-reveal"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -42px 0px" });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [active, activeSemester, docs.length, subjects.length, plannerItems.length, gradeData.columns.length, attendanceData.records.length]);

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
      else { const rows=subjectResult.data || []; const removed=new Set(rows.filter(row=>row.name.startsWith("__deleted__:")).map(row=>row.name.slice("__deleted__:".length))); setSubjects([...new Set([...(activeSemester === "2026.1" ? starter.filter(name=>!removed.has(name)) : []), ...rows.filter(row=>!row.name.startsWith("__deleted__:")).map(row=>row.name)])]); }
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


  useEffect(()=>{try{localStorage.setItem("luispp-planner-day",plannerSelectedDay||"");}catch{}},[plannerSelectedDay]);

  // Mural acadêmico: avisos e anotações sincronizados no Supabase.
  useEffect(() => {
    if (!workspaceReady || !supabase) { setNoticeItems([]); return; }
    let cancelled=false;
    const loadNotices=async()=>{
      setNoticeLoading(true);
      const {data,error}=await supabase.from("academic_notices").select("id,title,body,kind,subject,due_date,pinned,created_at,updated_at,notification_config").eq("user_id",WORKSPACE_OWNER_ID).eq("semester",activeSemester).order("pinned",{ascending:false}).order("due_date",{ascending:true,nullsFirst:false}).order("created_at",{ascending:false});
      if(cancelled)return;
      if(error)setError("Não foi possível carregar o mural: "+error.message); else setNoticeItems(data||[]);
      setNoticeLoading(false);
    };
    loadNotices();
    const channel=supabase.channel("luispp-notices-"+session?.user?.id+"-"+activeSemester).on("postgres_changes",{event:"*",schema:"public",table:"academic_notices",filter:"user_id=eq."+WORKSPACE_OWNER_ID},loadNotices).subscribe();
    return()=>{cancelled=true;supabase.removeChannel(channel);};
  },[workspaceReady,session?.user?.id,activeSemester]);

  // Planejamento geral: os dados ficam no Supabase e aparecem em qualquer dispositivo.
  useEffect(() => {
    if (!workspaceReady || !supabase) { setPlannerItems([]); return; }
    let cancelled = false;
    const loadPlanner = async () => {
      setPlannerLoading(true);
      const { data, error } = await supabase
        .from("academic_planner")
        .select("id,title,category,due_date,due_time,subject,description,completed,created_at,notification_config")
        .eq("user_id", WORKSPACE_OWNER_ID)
        .order("due_date", { ascending: true })
        .order("due_time", { ascending: true });
      if (cancelled) return;
      if (error) setError("Não foi possível carregar o planejamento: " + error.message);
      else { const rows=data||[]; setPlannerItems(rows); if(!plannerDayWasSaved && rows.length){ const today=localDateKey(); const nearest=rows.find(item=>item.due_date>=today)||rows[rows.length-1]; if(nearest){setPlannerSelectedDay(nearest.due_date);const d=new Date(nearest.due_date+"T12:00:00");setPlannerMonth(new Date(d.getFullYear(),d.getMonth(),1));} } }
      setPlannerLoading(false);
    };
    loadPlanner();
    const channel = supabase.channel("luispp-planner-" + session?.user?.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "academic_planner", filter: "user_id=eq." + WORKSPACE_OWNER_ID }, loadPlanner)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [workspaceReady, session?.user?.id]);

  const addPlannerItem = async (e) => {
    e.preventDefault();
    if (!plannerTitle.trim() || !plannerDate || !supabase) return;
    setPlannerLoading(true); setError(""); setNotice("");
    const { data, error } = await supabase.from("academic_planner").insert({
      user_id: WORKSPACE_OWNER_ID, title: plannerTitle.trim(), category: plannerCategory,
      due_date: plannerDate, due_time: plannerTime || null, subject: plannerSubject || null,
      description: plannerDescription.trim(), notification_config: plannerNotify
    }).select("id,title,category,due_date,due_time,subject,description,completed,created_at,notification_config").single();
    setPlannerLoading(false);
    if (error) { setError("Não consegui salvar a atividade: " + error.message); return; }
    setPlannerItems(prev => [...prev, data].sort((a,b) => (a.due_date + (a.due_time || "")).localeCompare(b.due_date + (b.due_time || ""))));
    setPlannerSelectedDay(plannerDate);
    setPlannerMonth(new Date(new Date(plannerDate + "T12:00:00").getFullYear(), new Date(plannerDate + "T12:00:00").getMonth(), 1));
    setPlannerTitle(""); setPlannerTime(""); setPlannerDescription(""); setPlannerSubject(""); setPlannerNotify({enabled:false,mode:"once",offset_minutes:1440,days:[],times:["08:00"]});
    setNotice("Atividade salva no planejamento geral.");
  };

  const togglePlannerItem = async (item) => {
    const { error } = await supabase.from("academic_planner").update({ completed: !item.completed }).eq("id", item.id).eq("user_id", WORKSPACE_OWNER_ID);
    if (error) { setError("Não consegui atualizar a atividade: " + error.message); return; }
    setPlannerItems(prev => prev.map(x => x.id === item.id ? { ...x, completed: !x.completed } : x));
  };

  const editPlannerItem = (item) => { setEditRecord({kind:"planner",id:item.id}); setEditForm({title:item.title||"",category:item.category||"Prova",due_date:item.due_date||localDateKey(),due_time:item.due_time||"",subject:item.subject||"",description:item.description||"",completed:!!item.completed,notification_config:item.notification_config||{enabled:false,mode:"once",offset_minutes:1440,days:[],times:["08:00"]}}); };
  const deletePlannerItem = async (item) => {
    if (!window.confirm("Excluir esta atividade do planejamento?")) return;
    const { error } = await supabase.from("academic_planner").delete().eq("id", item.id).eq("user_id", WORKSPACE_OWNER_ID);
    if (error) { setError("Não consegui excluir a atividade: " + error.message); return; }
    setPlannerItems(prev => prev.filter(x => x.id !== item.id));
  };

  const plannerMonthDays = (() => {
    const first = new Date(plannerMonth.getFullYear(), plannerMonth.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(plannerMonth.getFullYear(), plannerMonth.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  })();
  const plannerDayKey = day => day ? [plannerMonth.getFullYear(), String(plannerMonth.getMonth()+1).padStart(2,"0"), String(day).padStart(2,"0")].join("-") : "";
  const formatPlannerDate = value => value ? new Date(value+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}) : "";
  const plannerDayItems = plannerItems.filter(item => item.due_date === plannerSelectedDay);
  const toggleSelectedPlannerItem = async () => { if(!selectedPlannerItem) return; await togglePlannerItem(selectedPlannerItem); setSelectedPlannerItem(current=>current?{...current,completed:!current.completed}:null); };
  const plannerMonthLabel = plannerMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

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

  const addNotice = async (e) => {
    e.preventDefault();
    if(!noticeTitle.trim()||!supabase)return;
    setNoticeLoading(true);setError("");setNotice("");
    const {data,error}=await supabase.from("academic_notices").insert({user_id:WORKSPACE_OWNER_ID,semester:activeSemester,title:noticeTitle.trim(),body:noticeBody.trim(),kind:noticeKind,subject:noticeSubject||null,due_date:noticeDate||null,notification_config:noticeNotify}).select("id,title,body,kind,subject,due_date,pinned,created_at,updated_at,notification_config").single();
    setNoticeLoading(false);
    if(error){setError("Não consegui salvar no mural: "+error.message);return;}
    setNoticeItems(prev=>[data,...prev]);setNoticeTitle("");setNoticeBody("");setNoticeKind("Anotação");setNoticeSubject("");setNoticeDate("");setNoticeNotify({enabled:false,mode:"once",offset_minutes:1440,days:[],times:["08:00"]});setNotice("Anotação adicionada ao mural.");
  };
  const editNotice = (item) => { setEditRecord({kind:"notice",id:item.id}); setEditForm({title:item.title||"",body:item.body||"",kind:item.kind||"Anotação",subject:item.subject||"",due_date:item.due_date||"",pinned:!!item.pinned,notification_config:item.notification_config||{enabled:false,mode:"once",offset_minutes:1440,days:[],times:["08:00"]}}); };
  const saveEditRecord = async (e) => {
    e.preventDefault(); if(!editRecord)return; setEditSaving(true);setError("");setNotice("");
    try {
      if(editRecord.kind==="planner"){
        const v=editForm;if(!v.title?.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(v.due_date||""))throw new Error("Informe o nome e uma data válida.");
        const {data,error}=await supabase.from("academic_planner").update({title:v.title.trim(),category:v.category,due_date:v.due_date,due_time:v.due_time||null,subject:v.subject||null,description:v.description||"",completed:!!v.completed,notification_config:v.notification_config||{enabled:false}}).eq("id",editRecord.id).eq("user_id",WORKSPACE_OWNER_ID).select("id,title,category,due_date,due_time,subject,description,completed,created_at").single();if(error)throw error;
        setPlannerItems(prev=>prev.map(x=>x.id===data.id?data:x).sort((a,b)=>(a.due_date+(a.due_time||"")).localeCompare(b.due_date+(b.due_time||""))));if(selectedPlannerItem?.id===data.id)setSelectedPlannerItem(data);setNotice("Atividade atualizada.");
      } else if(editRecord.kind==="grade"){
        const v=editForm,max=Number(v.maxScore),score=v.score===""?"":Number(v.score);if(!v.name?.trim()||!Number.isFinite(max)||max<=0)throw new Error("Informe nome e valor máximo válido.");if(v.score!==""&&(!Number.isFinite(score)||score<0||score>max))throw new Error("A nota deve estar entre zero e o valor máximo.");
        await persistGradeData({...gradeData,columns:gradeData.columns.map(c=>c.id===editRecord.id?{...c,name:v.name.trim(),type:v.type,maxScore:max,score:v.score}:c)});
      } else {
        const v=editForm;if(!v.title?.trim()||!["Aviso urgente","Lembrete","Anotação"].includes(v.kind)||(v.due_date&&!/^\d{4}-\d{2}-\d{2}$/.test(v.due_date)))throw new Error("Confira título, tipo e data.");
        const {data,error}=await supabase.from("academic_notices").update({title:v.title.trim(),body:v.body||"",kind:v.kind,subject:v.subject||null,due_date:v.due_date||null,pinned:!!v.pinned,notification_config:v.notification_config||{enabled:false},updated_at:new Date().toISOString()}).eq("id",editRecord.id).eq("user_id",WORKSPACE_OWNER_ID).select("id,title,body,kind,subject,due_date,pinned,created_at,updated_at").single();if(error)throw error;
        setNoticeItems(prev=>prev.map(x=>x.id===data.id?data:x));setNotice("Registro do mural atualizado.");
      }
      setEditRecord(null);setEditForm({});
    }catch(err){setError("Não consegui salvar as alterações: "+(err.message||"Tente novamente."));}finally{setEditSaving(false);}
  };

  const deleteNotice = async (item) => {
    if(!window.confirm("Excluir este registro do mural?"))return;
    const {error}=await supabase.from("academic_notices").delete().eq("id",item.id).eq("user_id",WORKSPACE_OWNER_ID);
    if(error){setError("Não consegui excluir o registro: "+error.message);return;}
    setNoticeItems(prev=>prev.filter(x=>x.id!==item.id));
  };
  const toggleNoticePin = async (item) => {
    const {error}=await supabase.from("academic_notices").update({pinned:!item.pinned}).eq("id",item.id).eq("user_id",WORKSPACE_OWNER_ID);
    if(error){setError("Não consegui atualizar o aviso: "+error.message);return;}
    setNoticeItems(prev=>prev.map(x=>x.id===item.id?{...x,pinned:!x.pinned}:x));
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
    await supabase.from("subjects").delete().eq("name", "__deleted__:" + name).eq("semester", activeSemester).eq("user_id", WORKSPACE_OWNER_ID);
    setNewSubject(""); setAdding(false);
  };

  const deleteSubject = async (name) => {
    if (!window.confirm(`Remover a matéria “${name}” de ${activeSemester}? As notas e a frequência dessa matéria também serão apagadas. Os arquivos e atividades já vinculados permanecerão na biblioteca e no planejamento.`)) return;
    setError(""); setNotice("");
    const markerName = "__deleted__:" + name;
    const { error: markerError } = await supabase.from("subjects").upsert({ name: markerName, semester: activeSemester, user_id: WORKSPACE_OWNER_ID }, { onConflict: "user_id,semester,name" });
    if (markerError) { setError("Não consegui remover a matéria: " + markerError.message); return; }
    const { error: deleteError } = await supabase.from("subjects").delete().eq("name", name).eq("semester", activeSemester).eq("user_id", WORKSPACE_OWNER_ID);
    if (deleteError) { setError("A matéria foi marcada para remoção, mas não consegui apagar seus dados: " + deleteError.message); return; }
    setSubjects(prev => prev.filter(item => item !== name));
    if (active === name) setActive("Todas");
    setGradeData({ columns: [] }); setAttendanceData({ records: [] });
    setNotice(`Matéria “${name}” removida de ${activeSemester}.`);
  };

  const emptyGradeData = { columns: [] };
  useEffect(() => {
    if (active === "Todas" || active === "Notas" || active === "Planejamento" || active === "Mural" || !workspaceReady || !supabase) { setGradeData(emptyGradeData); setAttendanceData({records:[]}); return; }
    let cancelled = false; setGradeLoading(true);
    (async () => {
      const { data, error } = await supabase.from("subjects").select("grade_data,attendance_data").eq("name", active).eq("semester", activeSemester).eq("user_id", WORKSPACE_OWNER_ID).maybeSingle();
      if (cancelled) return;
      if (error) setError("Não consegui carregar as notas: " + error.message);
      setGradeData(data?.grade_data && Array.isArray(data.grade_data.columns) ? data.grade_data : emptyGradeData);
      const nextAttendance = data?.attendance_data && Array.isArray(data.attendance_data.records) ? data.attendance_data : {records:[]};
      setAttendanceData(nextAttendance);
      setAttendanceUnits(String(nextAttendance.config?.unitsPerDay || 1));
      setAttendanceRecordUnits(String(nextAttendance.config?.unitsPerDay || 1));
      setAttendanceMax(String(nextAttendance.config?.maxAbsences || 16));
      setGradeLoading(false);
    })();
    return () => { cancelled = true; };
  }, [active, activeSemester, workspaceReady]);

  const attendanceConfig = {
    schedule: Array.isArray(attendanceData.config?.schedule) ? attendanceData.config.schedule : [],
    unitsPerDay: Math.max(1, Number(attendanceData.config?.unitsPerDay) || 1),
    maxAbsences: Math.max(1, Number(attendanceData.config?.maxAbsences) || 16)
  };
  const absenceCount = attendanceData.records.filter(r => r.status === "Falta").reduce((sum, r) => sum + Math.max(1, Number(r.units) || 1), 0);
  const attendanceRemaining = Math.max(0, attendanceConfig.maxAbsences - absenceCount);
  const attendanceFailed = absenceCount >= attendanceConfig.maxAbsences;
  const persistAttendanceData = async (next) => {
    setAttendanceSaving(true);
    const { error } = await supabase.from("subjects").upsert({ name: active, semester: activeSemester, user_id: WORKSPACE_OWNER_ID, attendance_data: next }, { onConflict: "user_id,semester,name" });
    setAttendanceSaving(false);
    if (error) setError("Não consegui salvar as frequências: " + error.message);
    else { setAttendanceData(next); setNotice("Frequência salva automaticamente."); }
  };
  const saveAttendanceSettings = async () => {
    const config = { ...attendanceConfig, unitsPerDay: Math.max(1, Number(attendanceUnits) || 1), maxAbsences: Math.max(1, Number(attendanceMax) || 16) };
    await persistAttendanceData({ ...attendanceData, config });
    setAttendanceRecordUnits(String(config.unitsPerDay));
  };
  const addAttendanceSchedule = async () => {
    const day = Number(attendanceDay);
    const schedule = [...attendanceConfig.schedule.filter(x => Number(x.day) !== day), { day, start: attendanceStart, end: attendanceEnd }].sort((a,b) => a.day-b.day);
    await persistAttendanceData({ ...attendanceData, config: { ...attendanceConfig, schedule } });
  };
  const removeAttendanceSchedule = async (day) => persistAttendanceData({ ...attendanceData, config: { ...attendanceConfig, schedule: attendanceConfig.schedule.filter(x => Number(x.day) !== Number(day)) } });
  const addAttendanceRecord = async (e) => {
    e.preventDefault();
    const units = Math.max(1, Math.min(attendanceConfig.unitsPerDay, Number(attendanceRecordUnits) || 1));
    const record = { date: attendanceDate, status: attendanceStatus, units, note: attendanceNote.trim() };
    const records = [...attendanceData.records.filter(r => r.date !== attendanceDate), record].sort((a,b) => a.date.localeCompare(b.date));
    await persistAttendanceData({ ...attendanceData, records });
    setAttendanceNote("");
  };
  const removeAttendanceRecord = async (date) => persistAttendanceData({ ...attendanceData, records: attendanceData.records.filter(r => r.date !== date) });
  const persistGradeData = async (next) => {
    setGradeData(next);
    const { error } = await supabase.from("subjects").upsert({ name: active, semester: activeSemester, user_id: WORKSPACE_OWNER_ID, grade_data: next }, { onConflict: "user_id,semester,name" });
    if (error) setError("Não consegui salvar as notas: " + error.message);
    else setNotice("Notas salvas automaticamente.");
  };
  const addActivity = async (e) => {
    e.preventDefault(); const name = activityName.trim(); if (!name) return;
    const maxScore=Number(activityMaxScore);
    if(!Number.isFinite(maxScore)||maxScore<=0){setError("Informe quanto vale a avaliação.");return;}
    await persistGradeData({ ...gradeData, columns: [...gradeData.columns, { id: crypto.randomUUID(), name, type: activityType, maxScore, score: "" }] });
    setActivityName(""); setActivityType("Prova"); setActivityMaxScore("10");
  };
  const changeActivityScore = async (id, score) => persistGradeData({ ...gradeData, columns: gradeData.columns.map(c => c.id === id ? { ...c, score } : c) });
  const editActivity = (item) => { setEditRecord({kind:"grade",id:item.id}); setEditForm({name:item.name||"",type:item.type||"Prova",maxScore:String(item.maxScore??10),score:item.score??""}); };
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
  const downloadDoc = async (doc) => {
    setError(""); setNotice("");
    const { data, error } = await supabase.storage.from("academic-files").createSignedUrl(doc.path, 3600, { download: doc.name || true });
    if (error) { setError("Não consegui preparar o download: " + error.message); return; }
    window.location.assign(data.signedUrl);
  };
  const visible = useMemo(() => docs.filter(d => d.semester === activeSemester && (active === "Todas" || d.subject === active) && [d.title,d.name,d.subject,d.description].join(" ").toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.createdAt-a.createdAt), [docs,active,activeSemester,query]);
  const fmt = n => n < 1024 ? n + " B" : n < 1048576 ? (n/1024).toFixed(0) + " KB" : (n/1048576).toFixed(1) + " MB";
  const fileIcon = d => d.mime.includes("image") ? <ImageIcon/> : d.mime.includes("pdf") || d.mime.includes("presentation") ? <Presentation/> : <FileText/>;

  if (!authReady) return <main className="login"><div className="login-card"><div className="brand-mark"><BookOpen size={26}/></div><h1>Luis<span>.pp</span></h1><p>Conectando ao seu espaço acadêmico…</p></div></main>;
  if (!session) return <main className="login"><div className="login-card"><div className="brand-mark"><BookOpen size={26}/></div><span className="eyebrow">SEU ESPAÇO ACADÊMICO</span><h1>Luis<span>.pp</span></h1><p>Seus trabalhos, suas ideias e suas matérias em um só lugar.</p><form onSubmit={login}><label htmlFor="password">Senha de acesso</label><input id="password" type="password" inputMode="numeric" autoComplete="current-password" maxLength={4} required placeholder="Digite sua senha" value={password} onChange={e=>setPassword(e.target.value)}/><button className="primary full" type="submit" disabled={busy}><LockKeyhole size={17}/>{busy ? "Abrindo seu espaço…" : "Entrar no Luis.pp"}</button>{error&&<p className="error">{error}</p>}{notice&&<p className="success">{notice}</p>}</form><small>Seu espaço acadêmico, organizado em um só lugar.</small></div></main>;

  const editModal = editRecord ? <div className="edit-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!editSaving)setEditRecord(null);}}><section className="edit-modal" role="dialog" aria-modal="true"><div className="edit-modal-heading"><div><span className="eyebrow">EDITAR REGISTRO</span><h2>{editRecord.kind==="planner"?"Editar atividade":editRecord.kind==="grade"?"Editar avaliação":"Editar aviso"}</h2><p>Altere todos os campos que foram preenchidos no cadastro.</p></div><button type="button" onClick={()=>setEditRecord(null)} disabled={editSaving}><X/></button></div><form className="edit-record-form" onSubmit={saveEditRecord}>
{editRecord.kind==="planner"&&<><label className="edit-wide">Nome da atividade<input required value={editForm.title||""} onChange={e=>setEditForm(v=>({...v,title:e.target.value}))}/></label><label>Tipo<select value={editForm.category||"Prova"} onChange={e=>setEditForm(v=>({...v,category:e.target.value}))}>{["Prova","Trabalho","Tarefa","Estudo","Prazo de entrega","Evento acadêmico","Leitura","Apresentação","Outro"].map(x=><option key={x}>{x}</option>)}</select></label><label>Data<input type="date" required value={editForm.due_date||""} onChange={e=>setEditForm(v=>({...v,due_date:e.target.value}))}/></label><label>Horário<input type="time" value={editForm.due_time||""} onChange={e=>setEditForm(v=>({...v,due_time:e.target.value}))}/></label><label>Matéria<select value={editForm.subject||""} onChange={e=>setEditForm(v=>({...v,subject:e.target.value}))}><option value="">Geral — sem matéria</option>{subjects.map(x=><option key={x}>{x}</option>)}</select></label><label className="edit-wide">Descrição<textarea rows="4" value={editForm.description||""} onChange={e=>setEditForm(v=>({...v,description:e.target.value}))}/></label><label className="edit-check edit-wide"><input type="checkbox" checked={!!editForm.completed} onChange={e=>setEditForm(v=>({...v,completed:e.target.checked}))}/> Concluída</label></>}
{editRecord.kind==="grade"&&<><label className="edit-wide">Nome da avaliação<input required value={editForm.name||""} onChange={e=>setEditForm(v=>({...v,name:e.target.value}))}/></label><label>Tipo de avaliação<select value={editForm.type||"Prova"} onChange={e=>setEditForm(v=>({...v,type:e.target.value}))}>{["Prova","Trabalho","Seminário","Atividade","Participação","Projeto","Outra"].map(x=><option key={x}>{x}</option>)}</select></label><label>Quanto vale<input type="number" min="0.01" step="0.01" required value={editForm.maxScore??""} onChange={e=>setEditForm(v=>({...v,maxScore:e.target.value}))}/></label><label className="edit-wide">Nota obtida<input type="number" min="0" step="0.01" value={editForm.score??""} onChange={e=>setEditForm(v=>({...v,score:e.target.value}))} placeholder="Deixe vazio se ainda não realizou"/></label></>}
{editRecord.kind==="notice"&&<><label className="edit-wide">Título<input required value={editForm.title||""} onChange={e=>setEditForm(v=>({...v,title:e.target.value}))}/></label><label>Tipo<select value={editForm.kind||"Anotação"} onChange={e=>setEditForm(v=>({...v,kind:e.target.value}))}>{["Aviso urgente","Lembrete","Anotação"].map(x=><option key={x}>{x}</option>)}</select></label><label>Matéria<select value={editForm.subject||""} onChange={e=>setEditForm(v=>({...v,subject:e.target.value}))}><option value="">Geral</option>{subjects.map(x=><option key={x}>{x}</option>)}</select></label><label>Data<input type="date" value={editForm.due_date||""} onChange={e=>setEditForm(v=>({...v,due_date:e.target.value}))}/></label><label className="edit-check"><input type="checkbox" checked={!!editForm.pinned} onChange={e=>setEditForm(v=>({...v,pinned:e.target.checked}))}/> Fixar no topo</label><label className="edit-wide">Descrição<textarea rows="5" value={editForm.body||""} onChange={e=>setEditForm(v=>({...v,body:e.target.value}))}/></label></>}
<div className="edit-modal-actions"><button type="button" className="secondary" onClick={()=>setEditRecord(null)} disabled={editSaving}>Cancelar</button><button type="submit" className="primary" disabled={editSaving}>{editSaving?"Salvando…":"Salvar alterações"}</button></div></form></section></div>:null;

  return <div className="app"><aside className="sidebar"><button className={active==="Todas"?"nav active":"nav"} onClick={()=>setActive("Todas")}><FolderOpen size={18}/> Biblioteca de arquivos <span>{docs.filter(d=>d.semester===activeSemester).length}</span></button><button className={active==="Notas"?"nav active notes-nav":"nav notes-nav"} onClick={()=>setActive("Notas")}><GraduationCap size={18}/> Notas e médias <ChevronRight size={15}/></button><button className={active==="Planejamento"?"nav active planner-nav":"nav planner-nav"} onClick={()=>setActive("Planejamento")}><CalendarCheck size={18}/> Planejamento geral <ChevronRight size={15}/></button><button className={active==="Mural"?"nav active":"nav"} onClick={()=>setActive("Mural")}><StickyNote size={18}/> Mural acadêmico <ChevronRight size={15}/></button><div className="side-heading"><span>MINHAS MATÉRIAS</span><button type="button" onClick={()=>setAdding(!adding)} title="Adicionar matéria" aria-label="Adicionar matéria"><Plus size={18}/></button></div>{adding&&<form className="subject-form" onSubmit={addSubject}><input autoFocus value={newSubject} onChange={e=>setNewSubject(e.target.value)} placeholder="Nome da matéria"/><button aria-label="Salvar matéria"><Plus size={15}/></button></form>}<div className="subject-list">{subjects.map(s=><div className="subject-list-item" key={s}><button className={active===s?"nav active":"nav"} onClick={()=>setActive(s)}><BookOpen size={16}/><span className="subject-name">{s}</span><span>{docs.filter(d=>d.semester===activeSemester && d.subject===s).length}</span></button><button type="button" className="subject-delete-button" title={"Remover matéria " + s} aria-label={"Remover matéria " + s} onClick={()=>deleteSubject(s)}><Trash2 size={14}/></button></div>)}</div><div className="side-bottom"><button className="nav logout" onClick={async()=>{await supabase.auth.signOut();setActive("Todas");}}><LogOut size={17}/> Sair</button></div></aside><main className="content"><div className="topbar"><div className="page-brand"><div className="brand-mark"><BookOpen size={23}/></div><div><b>Luis<span>.pp</span></b><small>ESPAÇO ACADÊMICO</small></div></div><div className="semester-picker top-semester-picker"><CalendarDays size={17}/><select aria-label="Selecionar semestre" value={activeSemester} onChange={e=>{setActiveSemester(e.target.value);setActive("Todas");setQuery("");}}>{semesters.map(s=><option key={s} value={s}>{s}</option>)}</select><button title="Adicionar semestre" onClick={()=>setAddingSemester(!addingSemester)}><Plus size={16}/></button></div><button type="button" className="push-enable-button" onClick={installApp} hidden={isInstalled}>⬇ Instalar aplicativo</button><button type="button" className="push-enable-button" onClick={enablePush} disabled={pushBusy}>{pushBusy?"Ativando…":pushStatus==="on"?"🔔 Notificações ativas":"🔔 Ativar notificações"}</button></div><nav className="mobile-subjects" aria-label="Atalhos de matérias"><button className={active==="Todas"?"mobile-subject-chip selected":"mobile-subject-chip"} onClick={()=>setActive("Todas")}>Biblioteca</button>{subjects.map(subject=><button key={subject} className={active===subject?"mobile-subject-chip selected":"mobile-subject-chip"} onClick={()=>setActive(subject)}>{subject}</button>)}</nav>{active === "Mural" ? <section className="noticeboard-page"><div className="planner-heading"><span className="eyebrow">CENTRAL DE AVISOS · {activeSemester}</span><h1>Mural acadêmico</h1><p>Guarde avisos urgentes, lembretes e anotações da faculdade. Pesquise e filtre por matéria.</p></div>{(error||notice)&&<div className={error?"notice":"notice success-notice"}><span>{error||notice}</span><button type="button" onClick={()=>{setError("");setNotice("");}}><X size={16}/></button></div>}<section className="noticeboard-compose panel"><div className="planner-panel-title"><div><span className="eyebrow">NOVO REGISTRO</span><h2>O que você precisa lembrar?</h2></div><StickyNote size={25}/></div><form className="noticeboard-form" onSubmit={addNotice}><label>Título<input value={noticeTitle} onChange={e=>setNoticeTitle(e.target.value)} placeholder="Ex.: Aviso urgente sobre a aula de amanhã" required/></label><label>Tipo<select value={noticeKind} onChange={e=>setNoticeKind(e.target.value)}><option>Aviso urgente</option><option>Lembrete</option><option>Anotação</option></select></label><label>Matéria<select value={noticeSubject} onChange={e=>setNoticeSubject(e.target.value)}><option value="">Geral — faculdade inteira</option>{subjects.map(x=><option key={x} value={x}>{x}</option>)}</select></label><label>Data (opcional)<input type="date" value={noticeDate} onChange={e=>setNoticeDate(e.target.value)}/></label><label className="noticeboard-wide">Descrição<textarea value={noticeBody} onChange={e=>setNoticeBody(e.target.value)} placeholder="Escreva os detalhes, orientações ou o que não pode esquecer..."/></label><div className="noticeboard-wide notification-settings"><b>🔔 Quando deseja ser notificado?</b><label className="notification-toggle"><input type="checkbox" checked={noticeNotify.enabled} onChange={e=>setNoticeNotify(v=>({...v,enabled:e.target.checked}))}/> Ativar lembrete deste registro</label>{noticeNotify.enabled&&<div className="notification-fields"><label>Frequência<select value={noticeNotify.mode} onChange={e=>setNoticeNotify(v=>({...v,mode:e.target.value}))}><option value="once">Uma vez</option><option value="daily">Todos os dias até a data</option><option value="weekly">Dias específicos da semana</option></select></label>{noticeNotify.mode==="once"?<label>Antecedência<select value={noticeNotify.offset_minutes} onChange={e=>setNoticeNotify(v=>({...v,offset_minutes:Number(e.target.value)}))}><option value="0">No horário definido</option><option value="30">30 minutos antes</option><option value="60">1 hora antes</option><option value="120">2 horas antes</option><option value="1440">1 dia antes</option><option value="2880">2 dias antes</option></select></label>:<><label>Horário do aviso<input type="time" value={noticeNotify.times[0]||"08:00"} onChange={e=>setNoticeNotify(v=>({...v,times:[e.target.value]}))}/></label>{noticeNotify.mode==="weekly"&&<div className="notification-days">{["D","S","T","Q","Q","S","S"].map((d,i)=><label key={i}><input type="checkbox" checked={noticeNotify.days.includes(i)} onChange={e=>setNoticeNotify(v=>({...v,days:e.target.checked?[...v.days,i]:v.days.filter(x=>x!==i)}))}/>{d}</label>)}</div>}</>}</div>}</div><button className="primary noticeboard-wide" type="submit" disabled={noticeLoading}><Plus size={16}/>{noticeLoading?"Salvando…":"Adicionar ao mural"}</button></form></section><div className="noticeboard-tools"><div className="search"><Search size={18}/><input value={noticeSearch} onChange={e=>setNoticeSearch(e.target.value)} placeholder="Pesquisar avisos e anotações..."/></div><select aria-label="Filtrar mural por matéria" value={noticeFilter} onChange={e=>setNoticeFilter(e.target.value)}><option>Todas</option><option>Geral</option>{subjects.map(x=><option key={x} value={x}>{x}</option>)}</select></div><div className="noticeboard-list">{noticeLoading&&!noticeItems.length?<div className="empty">Carregando mural…</div>:noticeItems.filter(item=>(noticeFilter==="Todas"||(noticeFilter==="Geral"?!item.subject:item.subject===noticeFilter))&&[item.title,item.body,item.subject,item.kind].join(" ").toLowerCase().includes(noticeSearch.toLowerCase())).length===0?<div className="empty"><div className="empty-icon"><StickyNote size={26}/></div><h3>Nenhum registro encontrado</h3><p>Adicione um aviso ou ajuste sua pesquisa.</p></div>:noticeItems.filter(item=>(noticeFilter==="Todas"||(noticeFilter==="Geral"?!item.subject:item.subject===noticeFilter))&&[item.title,item.body,item.subject,item.kind].join(" ").toLowerCase().includes(noticeSearch.toLowerCase())).map(item=><article key={item.id} className={"noticeboard-card "+(item.kind==="Aviso urgente"?"urgent":item.kind==="Lembrete"?"reminder":"note")}><div className="noticeboard-card-top"><span className="noticeboard-kind">{item.kind==="Aviso urgente"?"⚠":item.kind==="Lembrete"?"◷":"✎"} {item.kind}</span><div><button type="button" onClick={()=>toggleNoticePin(item)} title={item.pinned?"Desafixar":"Fixar no topo"}>{item.pinned?"★":"☆"}</button><button type="button" onClick={()=>editNotice(item)} title="Editar aviso"><Pencil size={15}/></button><button type="button" onClick={()=>deleteNotice(item)} title="Excluir"><Trash2 size={15}/></button></div></div><h3>{item.title}</h3>{item.body&&<p>{item.body}</p>}<footer><span>{item.subject||"Geral · Faculdade"}</span>{item.due_date&&<time>{new Date(item.due_date+"T12:00:00").toLocaleDateString("pt-BR")}</time>}</footer></article>)}</div></section> : active === "Planejamento" ? <section className="planner-page">
  <div className="planner-heading"><span className="eyebrow">ORGANIZAÇÃO ACADÊMICA · {activeSemester}</span><h1>Planejamento geral</h1><p>Calendário, provas, trabalhos, tarefas, prazos e horários de estudo em um só lugar — sem ficar preso a uma matéria.</p></div>
  {(error||notice)&&<div className={error?"notice":"notice success-notice"}><span>{error||notice}</span><button onClick={()=>{setError("");setNotice("");}}><X size={16}/></button></div>}
  <div className="planner-overview"><div><CalendarCheck/><b>{plannerItems.length}</b><span>NO CALENDÁRIO</span></div><div><CheckCircle2/><b>{plannerItems.filter(x=>x.completed).length}</b><span>CONCLUÍDAS</span></div><div><Clock3/><b>{plannerItems.filter(x=>!x.completed).length}</b><span>PENDENTES</span></div></div>
  <div className="planner-layout">
    <section className="planner-calendar panel"><div className="planner-calendar-head"><div><span className="eyebrow">CALENDÁRIO ACADÊMICO</span><h2>{plannerMonthLabel}</h2></div><div className="planner-month-actions"><button type="button" aria-label="Mês anterior" onClick={()=>setPlannerMonth(new Date(plannerMonth.getFullYear(),plannerMonth.getMonth()-1,1))}><ChevronLeft/></button><button type="button" aria-label="Próximo mês" onClick={()=>setPlannerMonth(new Date(plannerMonth.getFullYear(),plannerMonth.getMonth()+1,1))}><ChevronRight/></button></div></div><div className="planner-weekdays">{["SEG","TER","QUA","QUI","SEX","SÁB","DOM"].map(d=><span key={d}>{d}</span>)}</div><div className="planner-calendar-grid">{plannerMonthDays.map((day,index)=>{const key=plannerDayKey(day);const dayItems=day?plannerItems.filter(item=>item.due_date===key):[];return <div key={day?"d"+day:"blank"+index} className={"planner-date-cell"+(day&&plannerSelectedDay===key?" selected":"")+(dayItems.length?" has-items":"")}>{day&&<button type="button" className="planner-day-number" aria-label={"Selecionar "+key} onClick={()=>setPlannerSelectedDay(key)}>{day}</button>}{dayItems.slice(0,2).map(item=><button type="button" className={"planner-calendar-event"+(item.completed?" completed":"")} key={item.id} onClick={()=>{setPlannerSelectedDay(key);setSelectedPlannerItem(item);}} title={item.title}>{item.due_time?item.due_time.slice(0,5)+" ":""}{item.title}</button>)}{dayItems.length>2&&<span className="planner-more-events">+{dayItems.length-2} mais</span>}</div>})}</div><button className="planner-today" type="button" onClick={()=>{const now=new Date();setPlannerMonth(new Date(now.getFullYear(),now.getMonth(),1));setPlannerSelectedDay(localDateKey(now));}}>Ir para hoje</button></section>
    <section className="planner-panel panel"><div className="planner-panel-title"><div><span className="eyebrow">NOVA ATIVIDADE</span><h2>Adicionar ao planejamento</h2><p>Escolha uma matéria se fizer sentido. Ela é opcional.</p></div><ListTodo size={25}/></div><form className="planner-form" onSubmit={addPlannerItem}><label className="planner-wide">Atividade<input value={plannerTitle} onChange={e=>setPlannerTitle(e.target.value)} placeholder="Ex.: Prova de sociologia, entregar trabalho..." required/></label><label>Tipo<select value={plannerCategory} onChange={e=>setPlannerCategory(e.target.value)}><option>Prova</option><option>Trabalho</option><option>Tarefa</option><option>Estudo</option><option>Prazo de entrega</option><option>Evento acadêmico</option><option>Leitura</option><option>Apresentação</option><option>Outro</option></select></label><label>Data<input type="date" value={plannerDate} onChange={e=>setPlannerDate(e.target.value)} required/></label><label>Horário<input type="time" value={plannerTime} onChange={e=>setPlannerTime(e.target.value)}/></label><label>Matéria (opcional)<select value={plannerSubject} onChange={e=>setPlannerSubject(e.target.value)}><option value="">Geral — sem matéria específica</option>{subjects.map(subject=><option key={subject} value={subject}>{subject}</option>)}</select></label><label className="planner-wide">Detalhes<textarea value={plannerDescription} onChange={e=>setPlannerDescription(e.target.value)} placeholder="Conteúdo para estudar, instruções ou observações..."/></label><div className="planner-wide notification-settings"><b>🔔 Quando deseja ser notificado?</b><label className="notification-toggle"><input type="checkbox" checked={plannerNotify.enabled} onChange={e=>setPlannerNotify(v=>({...v,enabled:e.target.checked}))}/> Ativar lembrete desta atividade</label>{plannerNotify.enabled&&<div className="notification-fields"><label>Frequência<select value={plannerNotify.mode} onChange={e=>setPlannerNotify(v=>({...v,mode:e.target.value}))}><option value="once">Uma vez</option><option value="daily">Todos os dias até a data</option><option value="weekly">Dias específicos da semana</option></select></label>{plannerNotify.mode==="once"?<label>Antecedência<select value={plannerNotify.offset_minutes} onChange={e=>setPlannerNotify(v=>({...v,offset_minutes:Number(e.target.value)}))}><option value="0">No horário da atividade</option><option value="30">30 minutos antes</option><option value="60">1 hora antes</option><option value="120">2 horas antes</option><option value="1440">1 dia antes</option><option value="2880">2 dias antes</option></select></label>:<><label>Horário do aviso<input type="time" value={plannerNotify.times[0]||"08:00"} onChange={e=>setPlannerNotify(v=>({...v,times:[e.target.value]}))}/></label>{plannerNotify.mode==="weekly"&&<div className="notification-days">{["D","S","T","Q","Q","S","S"].map((d,i)=><label key={i}><input type="checkbox" checked={plannerNotify.days.includes(i)} onChange={e=>setPlannerNotify(v=>({...v,days:e.target.checked?[...v.days,i]:v.days.filter(x=>x!==i)}))}/>{d}</label>)}</div>}</>}</div>}</div><button className="primary planner-wide" type="submit" disabled={plannerLoading}><Plus size={16}/>{plannerLoading?"Salvando…":"Adicionar ao calendário"}</button></form></section>
  </div>
  <div className="planner-list-heading"><div><span className="eyebrow">AGENDA DO DIA</span><h2>{plannerSelectedDay ? new Date(plannerSelectedDay+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"}) : "Todas as atividades"}</h2></div><button type="button" onClick={()=>setPlannerSelectedDay("")}>Ver todas</button></div>
  {plannerLoading&&!plannerItems.length?<div className="empty"><p>Carregando seu planejamento…</p></div>:<div className="planner-list">{(plannerSelectedDay?plannerDayItems:plannerItems).length===0?<div className="empty planner-empty"><div className="empty-icon"><CalendarCheck size={27}/></div><h3>Nenhuma atividade nesta data</h3><p>Cadastre uma prova, trabalho, prazo ou horário de estudo. Seus compromissos aparecerão aqui e no calendário.</p></div>:(plannerSelectedDay?plannerDayItems:plannerItems).map(item=><article className={item.completed?"planner-item completed":"planner-item"} key={item.id}><button className="planner-check" type="button" onClick={()=>togglePlannerItem(item)} aria-label="Marcar como concluída">{item.completed?<CheckCircle2/>:<Circle/>}</button><button className="planner-edit-button" type="button" title="Editar atividade" onClick={()=>editPlannerItem(item)}><Pencil size={15}/></button><div className="planner-date"><b>{new Date(item.due_date+"T12:00:00").getDate()}</b><span>{new Date(item.due_date+"T12:00:00").toLocaleDateString("pt-BR",{month:"short"})}</span></div><div className="planner-item-copy"><span className="planner-category">{item.category}</span><h3>{item.title}</h3>{item.description&&<p>{item.description}</p>}<small>{item.subject||"Planejamento geral"}{item.due_time?" · "+item.due_time.slice(0,5):""}</small></div><button className="planner-delete" type="button" onClick={()=>deletePlannerItem(item)} aria-label="Excluir atividade"><Trash2 size={16}/></button></article>)}</div>}
<PlannerDetails item={selectedPlannerItem} onClose={()=>setSelectedPlannerItem(null)} onToggle={toggleSelectedPlannerItem} onEdit={()=>editPlannerItem(selectedPlannerItem)}/>
</section> : active === "Notas" ? <section className="notes-home"><div className="notes-home-heading"><span className="eyebrow">ACOMPANHAMENTO ACADÊMICO · {activeSemester}</span><h1>Notas e médias</h1><p>Escolha uma disciplina para consultar avaliações, lançar notas e acompanhar sua média.</p></div><div className="notes-intro"><div className="notes-intro-icon"><GraduationCap size={25}/></div><div><b>Seu desempenho, em um só lugar</b><span>A média mínima para aprovação é 5,0. As notas são salvas automaticamente.</span></div></div><div className="notes-subject-grid">{subjects.map((subject,index)=><button type="button" className="notes-subject-card" key={subject} onClick={()=>setActive(subject)}><span className="notes-card-icon"><BookOpen size={19}/></span><span className="notes-card-copy"><small>DISCIPLINA {String(index+1).padStart(2,"0")}</small><b>{subject}</b><em>Abrir boletim e lançar notas</em></span><span className="notes-card-arrow"><ChevronRight size={18}/></span></button>)}</div>{subjects.length===0&&<div className="empty"><h3>Nenhuma matéria cadastrada</h3><p>Adicione uma matéria para começar a acompanhar suas notas.</p></div>}<button className="notes-back-library" onClick={()=>setActive("Todas")}><FolderOpen size={16}/> Voltar à biblioteca de arquivos</button></section> : active !== "Todas" ? <section className="discipline-page">
      <div className="discipline-heading"><button className="back-link" onClick={() => setActive("Todas")}><FolderOpen size={16}/> Voltar à biblioteca</button><span className="eyebrow">DISCIPLINA · {activeSemester}</span><h1>{active}</h1><p>Organize suas avaliações e acompanhe seu desempenho nesta matéria.</p></div>
      {(error||notice)&&<div className={error?"notice":"notice success-notice"}><span>{error||notice}</span><button onClick={()=>{setError("");setNotice("");}}><X size={16}/></button></div>}<div className="grade-summary"><div><span>NOTA FINAL</span><strong>{gradeCount ? gradeFinal.toFixed(2).replace(".", ",") : "—"}</strong><small>Soma das notas ÷ 2</small></div><div><span>SITUAÇÃO</span><strong className={hasGrades ? passed ? "grade-status approved" : "grade-status failed" : "grade-status pending"}>{hasGrades ? passed ? "Aprovado" : "Reprovado" : "Aguardando"}</strong><small>{hasGrades ? passed ? "Você atingiu a média 5,0." : "Faltam " + (passingGrade-gradeFinal).toFixed(2).replace(".", ",") + " pontos para a média." : "Insira suas notas para calcular."}</small></div><div><span>AVALIAÇÕES LANÇADAS</span><strong>{gradeCount}<small> / {gradeData.columns.length}</small></strong><small>Notas preenchidas</small></div></div>
      <section className="attendance-panel glass-surface">
        <div className="attendance-heading"><div><span className="eyebrow">CONTROLE DE FREQUÊNCIA</span><h2>Presenças e faltas</h2><p>Configure os dias de aula e quantas aulas contam por dia. O sistema soma as faltas automaticamente.</p></div><button type="button" className="attendance-settings-toggle" onClick={()=>setAttendanceSettingsOpen(v=>!v)}><Pencil size={15}/> Configurar matéria</button></div>
        <div className="attendance-stats">
          <div><span>FALTAS ACUMULADAS</span><strong>{absenceCount}</strong><small>de {attendanceConfig.maxAbsences} permitidas</small></div>
          <div><span>FALTAS RESTANTES</span><strong>{attendanceRemaining}</strong><small>Antes da reprovação</small></div>
          <div><span>SITUAÇÃO</span><strong className={attendanceFailed?"attendance-failed":"attendance-ok"}>{attendanceFailed?"Reprovado":"Dentro do limite"}</strong><small>{attendanceFailed?"Limite de faltas atingido":"Você pode ter mais "+attendanceRemaining+" falta(s)"}</small></div>
        </div>
        {attendanceSettingsOpen&&<div className="attendance-settings">
          <div className="attendance-settings-title"><b>Configurações de {active}</b><span>Essas regras valem somente para esta matéria e semestre.</span></div>
          <div className="attendance-settings-grid">
            <label>Quantidade de aulas por dia<input type="number" min="1" max="12" value={attendanceUnits} onChange={e=>setAttendanceUnits(e.target.value)}/></label>
            <label>Limite de faltas para reprovação<input type="number" min="1" max="100" value={attendanceMax} onChange={e=>setAttendanceMax(e.target.value)}/></label>
          </div>
          <div className="attendance-schedule-form"><label>Dia da semana<select value={attendanceDay} onChange={e=>setAttendanceDay(e.target.value)}>{["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"].map((d,i)=><option value={i} key={i}>{d}</option>)}</select></label><label>Início<input type="time" value={attendanceStart} onChange={e=>setAttendanceStart(e.target.value)}/></label><label>Término<input type="time" value={attendanceEnd} onChange={e=>setAttendanceEnd(e.target.value)}/></label><button type="button" className="secondary" onClick={addAttendanceSchedule}><Plus size={15}/> Adicionar dia</button></div>
          <div className="attendance-schedule-list">{attendanceConfig.schedule.length?attendanceConfig.schedule.map(item=><span key={item.day}>{["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][item.day]} · {item.start}–{item.end}<button type="button" onClick={()=>removeAttendanceSchedule(item.day)} aria-label="Remover dia"><X size={13}/></button></span>):<small>Nenhum dia de aula configurado ainda.</small>}</div>
          <button type="button" className="primary" onClick={saveAttendanceSettings} disabled={attendanceSaving}>{attendanceSaving?"Salvando…":"Salvar configurações"}</button>
        </div>}
        <form className="attendance-entry" onSubmit={addAttendanceRecord}>
          <label>Data da aula<input type="date" value={attendanceDate} onChange={e=>setAttendanceDate(e.target.value)} required/></label>
          <label>Registro<select value={attendanceStatus} onChange={e=>setAttendanceStatus(e.target.value)}><option>Presente</option><option>Falta</option></select></label>
          <label>Quantidade de aulas<input type="number" min="1" max={attendanceConfig.unitsPerDay} value={attendanceRecordUnits} onChange={e=>setAttendanceRecordUnits(e.target.value)}/></label>
          <label className="attendance-note">Observação (opcional)<input value={attendanceNote} onChange={e=>setAttendanceNote(e.target.value)} placeholder="Ex.: atestado, reposição..."/></label>
          <button className="primary" type="submit" disabled={attendanceSaving}><Check size={15}/> Registrar</button>
        </form>
        <div className="attendance-records"><div className="attendance-records-title"><b>Histórico de frequência</b><span>{attendanceData.records.length} registro(s)</span></div>
          {attendanceData.records.length===0?<p className="attendance-empty">Nenhuma presença ou falta registrada nesta matéria.</p>:attendanceData.records.slice().reverse().map(record=><div className="attendance-record" key={record.date}><span className={record.status==="Falta"?"attendance-dot absent":"attendance-dot present"}></span><b>{new Date(record.date+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})}</b><span>{record.status} · {record.units} aula(s)</span>{record.note&&<small>{record.note}</small>}<button type="button" onClick={()=>removeAttendanceRecord(record.date)} aria-label="Excluir registro"><Trash2 size={14}/></button></div>)}
        </div>
      </section>
      <section className="grade-panel"><div className="grade-panel-title"><div><span className="eyebrow">ACOMPANHAMENTO ACADÊMICO</span><h2>Boletim de avaliações</h2><p>Adicione provas, trabalhos e outras atividades. O cálculo é atualizado automaticamente.</p></div><span className="grade-semester">{activeSemester}</span></div>
      <form className="activity-form" onSubmit={addActivity}><label>Nome da avaliação<input value={activityName} onChange={e=>setActivityName(e.target.value)} placeholder="Ex.: Prova 1, Trabalho em grupo..." required/></label><label>Tipo de avaliação<select value={activityType} onChange={e=>setActivityType(e.target.value)}><option>Prova</option><option>Trabalho</option><option>Seminário</option><option>Atividade</option><option>Participação</option><option>Projeto</option><option>Outra</option></select></label><label>Quanto vale<input type="number" min="0.01" step="0.01" value={activityMaxScore} onChange={e=>setActivityMaxScore(e.target.value)} required/></label><button className="primary" type="submit"><Plus size={16}/> Adicionar avaliação</button></form>
      {gradeLoading ? <div className="grade-empty">Carregando suas notas…</div> : gradeData.columns.length === 0 ? <div className="grade-empty"><div className="empty-icon"><Layers3 size={25}/></div><b>Sua tabela ainda está vazia</b><p>Adicione a primeira avaliação para começar a acompanhar sua nota.</p></div> : <div className="grade-table-wrap"><table className="grade-table"><thead><tr><th>AVALIAÇÃO</th><th>TIPO</th><th>VALOR</th><th>NOTA</th><th>FALTA</th><th></th></tr></thead><tbody>{gradeData.columns.map(c=>{const max=Number(c.maxScore)||0;const score=c.score!==""&&Number.isFinite(Number(c.score))?Number(c.score):null;const missing=max>0&&score!==null?Math.max(0,max-score):max;return <tr key={c.id}><td className="grade-activity-name">{c.name}</td><td><span className="activity-type">{c.type}</span></td><td>{max?max.toLocaleString("pt-BR"):"—"}</td><td><input className="grade-input" type="number" min="0" max={max||undefined} step="0.01" placeholder="—" value={c.score} onChange={e=>setGradeData(prev=>({...prev,columns:prev.columns.map(item=>item.id===c.id?{...item,score:e.target.value}:item)}))} onBlur={e=>changeActivityScore(c.id,e.target.value)}/></td><td>{score===null?"Aguardando":missing===0?<span className="grade-complete">Completa</span>:missing.toLocaleString("pt-BR",{maximumFractionDigits:2})}</td><td><div className="grade-row-actions"><button className="grade-remove" type="button" title="Editar avaliação" onClick={()=>editActivity(c)}><Pencil size={14}/></button><button className="grade-remove" type="button" title="Excluir avaliação" onClick={()=>removeActivity(c.id)}><Trash2 size={15}/></button></div></td></tr>})}</tbody><tfoot><tr><td colSpan="2">NOTA FINAL · SOMA ÷ 2</td><td className="grade-final-cell">{gradeFinal.toFixed(2).replace(".", ",")}</td><td></td></tr></tfoot></table></div>}
      <div className="grade-rule"><Check size={16}/><span><b>Critério de aprovação:</b> a nota final é a soma de todas as notas preenchidas dividida por 2. A média mínima para aprovação é <b>5,0</b>. Com notas lançadas, a situação é atualizada automaticamente.</span></div></section>
      {plannerItems.filter(item=>item.subject===active).length>0&&<section className="subject-planner-panel"><div className="section-title"><div><span className="eyebrow">VINCULADO AO PLANEJAMENTO GERAL</span><h2>Atividades desta matéria</h2><p>Os compromissos cadastrados no calendário para {active}.</p></div></div><div className="planner-list">{plannerItems.filter(item=>item.subject===active).map(item=><article className={item.completed?"planner-item completed":"planner-item"} key={item.id}><button className="planner-check" type="button" onClick={()=>togglePlannerItem(item)} aria-label={item.completed?"Reabrir atividade":"Marcar como concluída"}>{item.completed?<CheckCircle2/>:<Circle/>}</button><button className="planner-edit-button" type="button" title="Editar atividade" onClick={()=>editPlannerItem(item)}><Pencil size={15}/></button><div className="planner-date"><b>{new Date(item.due_date+"T12:00:00").getDate()}</b><span>{new Date(item.due_date+"T12:00:00").toLocaleDateString("pt-BR",{month:"short"})}</span></div><div className="planner-item-copy"><span className="planner-category">{item.category}</span><h3>{item.title}</h3>{item.description&&<p>{item.description}</p>}<small>{formatPlannerDate(item.due_date)}{item.due_time?" · "+item.due_time.slice(0,5):""}</small></div></article>)}</div></section>}
      <section className="discipline-files"><div><h2>Materiais desta disciplina</h2><p>{visible.length} {visible.length===1?"arquivo":"arquivos"} armazenados neste semestre</p></div><label className="upload-btn"><Upload size={16}/>{uploading?"Enviando…":"Adicionar material"}<input type="file" multiple onChange={addFiles} hidden disabled={uploading}/></label></section>
      {visible.length ? <div className="file-grid">{visible.map(d=><article className="file-card" key={d.id}><div className="file-top"><div className="file-icon">{fileIcon(d)}</div><div className="file-tools"><button className="icon-btn rename" title="Renomear arquivo" onClick={()=>renameDoc(d)}><Pencil size={15}/></button><button className="icon-btn delete" title="Excluir arquivo" onClick={()=>removeDoc(d)}><Trash2 size={16}/></button></div></div><h3>{d.title}</h3><p className="filename">{d.name}</p><div className="file-actions"><button className="secondary" onClick={()=>getUrl(d)}><ExternalLink size={15}/> Abrir</button><button className="secondary square" onClick={()=>downloadDoc(d)}><Download size={16}/></button></div></article>)}</div> : <div className="empty"><p>Nenhum material foi adicionado a esta disciplina ainda.</p></div>}
    </section> : <><header><div><span className="eyebrow">BIBLIOTECA PESSOAL</span><h1>{active==="Todas"?"Meus trabalhos":active}</h1><p>Um lugar para guardar tudo o que você aprende.</p></div><label className="upload-btn"><Upload size={17}/>{uploading?"Enviando…":"Adicionar arquivo"}<input type="file" multiple onChange={addFiles} hidden disabled={uploading}/></label></header>{(error||notice)&&<div className={error?"notice":"notice success-notice"}><span>{error||notice}</span><button onClick={()=>{setError("");setNotice("");}}><X size={16}/></button></div>}<section className="toolbar"><div className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar trabalho, arquivo ou matéria..."/></div><span className="count">{visible.length} {visible.length===1?"arquivo":"arquivos"}</span></section>{addingSemester&&<form className="semester-form glass-panel" onSubmit={addSemester}><div><b>Novo semestre</b><span>Ex.: 2026.2 ou 2027.1</span></div><input autoFocus value={newSemester} onChange={e=>setNewSemester(e.target.value)} placeholder="2026.2" required/><button className="primary" type="submit"><Check size={15}/> Adicionar</button></form>}<div className="section-title"><div><h2>Arquivos recentes</h2><p>Os últimos materiais adicionados à sua biblioteca.</p></div><span className="recent"><Clock3 size={15}/> Atualizados recentemente</span></div>{visible.length===0?<div className="empty"><div className="empty-icon"><FolderOpen size={28}/></div><h3>{query?"Nenhum resultado encontrado":"Sua biblioteca começa aqui"}</h3><p>{query?"Tente buscar com outro termo.":"Adicione um arquivo da aula para ele aparecer aqui."}</p><label className="secondary upload-inline"><Plus size={16}/> Adicionar primeiro arquivo<input type="file" multiple hidden onChange={addFiles}/></label></div>:<div className="file-grid">{visible.map(d=><article className="file-card" key={d.id}><div className="file-top"><div className="file-icon">{fileIcon(d)}</div><div className="file-tools"><button className="icon-btn rename" title="Renomear arquivo" aria-label={"Renomear " + d.name} onClick={()=>renameDoc(d)}><Pencil size={15}/></button><button className="icon-btn delete" title="Excluir arquivo" aria-label={"Excluir " + d.name} onClick={()=>removeDoc(d)}><Trash2 size={16}/></button></div></div><h3 title={d.title}>{d.title}</h3><p className="filename">{d.name}</p><div className="file-meta"><span>{d.subject}</span><span>{d.semester} · {fmt(d.size)}</span></div><div className="file-actions"><button className="secondary" onClick={()=>getUrl(d)}><ExternalLink size={15}/> Abrir</button><button className="secondary square" title="Baixar" onClick={()=>downloadDoc(d)}><Download size={16}/></button></div></article>)}</div>}<footer>Luis.pp <span>·</span> Feito para acompanhar sua jornada acadêmica.</footer></> }</main>{editModal}</div>;
}
createRoot(document.getElementById("root")).render(<App/>);