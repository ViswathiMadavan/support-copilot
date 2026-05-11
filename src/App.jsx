import React, { useState } from "react";
import {
  LifeBuoy, Mail, MessageCircle, Bell, Activity, Github, Linkedin,
  Clock, User, Building2, AlertCircle, FileText,
} from "lucide-react";
import { tickets, priorityColors } from "./data/tickets.js";
import { agents } from "./data/agents.js";
import { getOutputsForTicket } from "./data/outputs.js";

const channelIcons = {
  email: Mail,
  chat: MessageCircle,
  ticket: AlertCircle,
  pagerduty: Bell,
  "internal-monitoring": Activity,
};

export default function App() {
  const [selectedTicketId, setSelectedTicketId] = useState(tickets[6].id); // start on T-1007 (P1 incident, makes a strong first impression)
  const [selectedAgentId, setSelectedAgentId] = useState("triage");

  const ticket = tickets.find(t => t.id === selectedTicketId);
  const outputs = getOutputsForTicket(selectedTicketId);
  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="min-h-screen flex flex-col">
      <DemoBanner />
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4">
          <TicketList selectedId={selectedTicketId} onSelect={setSelectedTicketId} />
        </aside>
        <section className="lg:col-span-8 space-y-6">
          <TicketDetail ticket={ticket} />
          <AgentTabs selectedId={selectedAgentId} onSelect={setSelectedAgentId} />
          <AgentOutput agent={selectedAgent} output={outputs[selectedAgentId]} />
        </section>
      </main>
      <Footer />
    </div>
  );
}

// ---------- Demo Banner ----------
function DemoBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900 text-center">
      <span className="font-medium">ℹ️ Demo mode</span> — all tickets, customer names, and incident data shown are fictional and for illustrative purposes only.
    </div>
  );
}

// ---------- Header ----------
function Header() {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-600 text-white rounded-lg p-2">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Support Copilot</h1>
            <p className="text-xs text-slate-500">AI-assisted workflow for customer support and application support</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm text-slate-600">
          <a
            href="https://github.com/ViswathiMadavan/support-copilot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-slate-900"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/viswathi-madavan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-slate-900"
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </a>
        </div>
      </div>
    </header>
  );
}

// ---------- Ticket List ----------
function TicketList({ selectedId, onSelect }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-700">Inbox</h2>
        <span className="text-xs text-slate-500">{tickets.length} tickets</span>
      </div>
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {tickets.map(t => {
          const ChannelIcon = channelIcons[t.channel] || AlertCircle;
          const isSelected = t.id === selectedId;
          const colors = priorityColors[t.priority];
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition ${
                isSelected ? "bg-brand-50 border-l-4 border-brand-600" : "border-l-4 border-transparent"
              }`}
            >
              <div className="flex items-start gap-2 mb-1">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                  {t.priority}
                </span>
                <ChannelIcon className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                <span className="text-xs text-slate-500 ml-auto">{t.id}</span>
              </div>
              <p className="text-sm font-medium text-slate-900 line-clamp-2 mb-1">{t.title}</p>
              <p className="text-xs text-slate-500 truncate">
                {t.customer.company} · {t.category}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Ticket Detail ----------
function TicketDetail({ ticket }) {
  const ChannelIcon = channelIcons[ticket.channel] || AlertCircle;
  const colors = priorityColors[ticket.priority];
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex items-start gap-3 mb-3">
        <span className={`text-xs font-bold px-2 py-1 rounded ${colors.bg} ${colors.text}`}>
          {ticket.priority}
        </span>
        <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded">
          {ticket.category}
        </span>
        <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
          <ChannelIcon className="w-3.5 h-3.5" />
          {ticket.channel}
        </span>
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">{ticket.title}</h2>
      <div className="flex flex-wrap gap-4 text-xs text-slate-600 mb-4">
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          {ticket.customer.name}
        </span>
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          {ticket.customer.company} · {ticket.customer.tier}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {new Date(ticket.receivedAt).toLocaleString()}
        </span>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
        {ticket.body}
      </div>
    </div>
  );
}

// ---------- Agent Tabs ----------
function AgentTabs({ selectedId, onSelect }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
        {agents.map(agent => {
          const Icon = agent.icon;
          const isSelected = agent.id === selectedId;
          return (
            <button
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              className={`text-left px-3 py-2 rounded transition ${
                isSelected
                  ? "bg-brand-600 text-white"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <p className="text-xs font-semibold leading-tight">{agent.name}</p>
              <p className={`text-[10px] mt-0.5 ${isSelected ? "text-brand-100" : "text-slate-500"}`}>
                {agent.short}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Agent Output ----------
function AgentOutput({ agent, output }) {
  const Icon = agent.icon;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <div className="flex items-start gap-3 mb-4 pb-4 border-b border-slate-100">
        <div className="bg-brand-50 text-brand-600 rounded-lg p-2">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">{agent.name}</h3>
          <p className="text-xs text-slate-500">{agent.description}</p>
        </div>
      </div>
      <OutputRenderer agentId={agent.id} output={output} />
    </div>
  );
}

function OutputRenderer({ agentId, output }) {
  if (agentId === "triage") return <TriageView o={output} />;
  if (agentId === "drafter") return <DrafterView o={output} />;
  if (agentId === "kb") return <KbView o={output} />;
  if (agentId === "rca") return <RcaView o={output} />;
  if (agentId === "escalation") return <EscalationView o={output} />;
  if (agentId === "trends") return <TrendsView o={output} />;
  return null;
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</dt>
      <dd className="text-sm text-slate-800">{children}</dd>
    </div>
  );
}

function TriageView({ o }) {
  const colors = priorityColors[o.severity];
  return (
    <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Field label="Severity">
        <span className={`text-xs font-bold px-2 py-1 rounded ${colors.bg} ${colors.text}`}>{o.severity}</span>
      </Field>
      <Field label="Category">{o.category}</Field>
      <Field label="Team">{o.team}</Field>
      <Field label="SLA target">{o.sla_target}</Field>
      <div className="col-span-2 md:col-span-4">
        <Field label="Reasoning">{o.reasoning}</Field>
      </div>
    </dl>
  );
}

function DrafterView({ o }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Audience">{o.audience}</Field>
        <Field label="Tone">{o.tone}</Field>
      </div>
      <Field label="Draft reply">
        <pre className="bg-slate-50 border border-slate-200 rounded p-3 text-sm whitespace-pre-wrap font-sans leading-relaxed mt-1">
          {o.draft_reply}
        </pre>
      </Field>
      <Field label="Missing info to confirm before sending">
        <ul className="list-disc list-inside space-y-1">
          {o.missing_info.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </Field>
    </div>
  );
}

function KbView({ o }) {
  const relColor = { high: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800", low: "bg-slate-100 text-slate-700" };
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 italic mb-2">
        Demo: these article titles illustrate what the agent would surface from your internal KB or runbooks. In a live deployment, each item would link to the corresponding article in Confluence, Notion, Zendesk Guide, etc.
      </p>
      {o.map((item, i) => (
        <div key={i} className="border border-slate-200 rounded p-3 bg-slate-50/50">
          <div className="flex items-start gap-2 mb-1">
            <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <h4 className="text-sm font-semibold text-slate-900 flex-1">{item.title}</h4>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${relColor[item.relevance]}`}>
              {item.relevance}
            </span>
          </div>
          <p className="text-xs text-slate-600 ml-6 mb-1">{item.snippet}</p>
          <p className="text-[10px] text-slate-400 ml-6 uppercase tracking-wide">{item.article_type}</p>
        </div>
      ))}
    </div>
  );
}

function RcaView({ o }) {
  const confColor = { high: "bg-red-100 text-red-800", medium: "bg-amber-100 text-amber-800", low: "bg-slate-100 text-slate-700" };
  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500 italic">
        Demo: hypotheses are the agent's structured output for review by a human engineer — not links. In a live deployment, the engineer would use these to guide investigation in their APM, logs, or runbooks.
      </p>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Hypotheses</dt>
        <div className="space-y-2">
          {o.hypotheses.map((h, i) => (
            <div key={i} className="border border-slate-200 rounded p-3">
              <div className="flex items-start gap-2 mb-1">
                <span className="text-sm font-medium text-slate-900 flex-1">{h.cause}</span>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${confColor[h.confidence]}`}>
                  {h.confidence}
                </span>
              </div>
              <p className="text-xs text-slate-600">Evidence: {h.evidence}</p>
            </div>
          ))}
        </div>
      </div>
      <Field label="Diagnostic steps">
        <ol className="list-decimal list-inside space-y-1">
          {o.diagnostic_steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </Field>
      <Field label="Data to gather">
        <ul className="list-disc list-inside space-y-1">
          {o.data_to_gather.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </Field>
    </div>
  );
}

function EscalationView({ o }) {
  return (
    <div className="space-y-4">
      <Field label="One-line summary">{o.one_line_summary}</Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Affected users">{o.affected_users}</Field>
        <Field label="Urgency justification">{o.urgency_justification}</Field>
      </div>
      <Field label="Reproduction steps">
        <ol className="list-decimal list-inside space-y-1">
          {o.reproduction_steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </Field>
      <Field label="What we tried">
        <ul className="list-disc list-inside space-y-1">
          {o.what_we_tried.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </Field>
      <Field label="What we need from receiving team">{o.what_we_need}</Field>
    </div>
  );
}

function TrendsView({ o }) {
  return (
    <div className="space-y-5">
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Top categories</dt>
        <div className="space-y-1.5">
          {o.top_categories.map((c, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{c.count}</span>
              <span className="font-medium text-slate-900">{c.category}</span>
              {c.note && <span className="text-xs text-slate-500">— {c.note}</span>}
            </div>
          ))}
        </div>
      </div>
      <Field label="Emerging patterns">
        <ul className="list-disc list-inside space-y-1.5">
          {o.emerging_patterns.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </Field>
      <Field label="SLA health">{o.sla_health}</Field>
      <Field label="Recommendations for this week">
        <ul className="list-disc list-inside space-y-1.5">
          {o.recommendations.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </Field>
      <Field label="Notable outliers">
        <ul className="list-disc list-inside space-y-1.5">
          {o.notable_outliers.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      </Field>
    </div>
  );
}

// ---------- Footer ----------
function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-6 px-4 mt-8">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-xs text-slate-500 mb-1">
          Sample data only. No real customer or employer data is used in this demo.
        </p>
        <p className="text-xs text-slate-500">
          Built by Viswathi Madavan ·{" "}
          <a href="https://github.com/ViswathiMadavan/support-copilot" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
            GitHub
          </a>
          {" "}·{" "}
          <a href="https://www.linkedin.com/in/viswathi-madavan" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
            LinkedIn
          </a>
        </p>
      </div>
    </footer>
  );
}
