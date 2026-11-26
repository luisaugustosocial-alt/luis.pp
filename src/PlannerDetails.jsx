import React from "react";
import { CalendarDays, Clock3, BookOpen, CheckCircle2, X, Pencil } from "lucide-react";

export default function PlannerDetails({ item, onClose, onToggle, onEdit }) {
  if (!item) return null;
  const date = new Date(item.due_date + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  return (
    <div className="planner-modal-backdrop">
      <section className="planner-detail-modal" role="dialog" aria-modal="true" aria-labelledby="planner-detail-title">
        <div className="planner-detail-head">
          <span className="eyebrow">DETALHES DA ATIVIDADE</span>
          <button type="button" className="planner-detail-close" aria-label="Fechar" onClick={onClose}><X size={19}/></button>
        </div>
        <span className="planner-category">{item.category}</span>
        <h2 id="planner-detail-title">{item.title}</h2>
        <div className="planner-detail-meta">
          <span><CalendarDays size={16}/>{date}</span>
          {item.due_time && <span><Clock3 size={16}/>{item.due_time.slice(0,5)}</span>}
          <span><BookOpen size={16}/>{item.subject || "Planejamento geral"}</span>
          <span><CheckCircle2 size={16}/>{item.completed ? "Concluída" : "Pendente"}</span>
        </div>
        <div className="planner-detail-description"><b>Descrição</b><p>{item.description?.trim() || "Nenhuma descrição foi adicionada."}</p></div>
        <div className="planner-detail-actions">
          <button type="button" className="secondary" onClick={onEdit}><Pencil size={15}/> Editar</button><button type="button" className="secondary" onClick={onClose}>Fechar</button>
          <button type="button" className="primary" onClick={onToggle}>{item.completed ? "Reabrir atividade" : "Marcar como concluída"}</button>
        </div>
      </section>
    </div>
  );
}
