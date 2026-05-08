import { Inbox, MessageSquare, BookOpen, Search, ArrowRightLeft, TrendingUp } from "lucide-react";

export const agents = [
  {
    id: "triage",
    name: "Ticket Triage & Routing",
    icon: Inbox,
    short: "Severity, category, team, SLA",
    description: "Classifies incoming tickets by priority, category, and routes to the right team with an SLA target.",
  },
  {
    id: "drafter",
    name: "Response Drafter",
    icon: MessageSquare,
    short: "Tone-aware reply drafts",
    description: "Generates empathetic customer replies for CX tickets and stakeholder updates for incidents.",
  },
  {
    id: "kb",
    name: "KB & Runbook Lookup",
    icon: BookOpen,
    short: "Relevant articles & runbooks",
    description: "Surfaces the top 3 most relevant knowledge base articles or internal runbooks for the ticket.",
  },
  {
    id: "rca",
    name: "Root Cause Analyzer",
    icon: Search,
    short: "Hypotheses + diagnostic steps",
    description: "Takes logs, errors, or symptoms and proposes likely causes plus next diagnostic steps.",
  },
  {
    id: "escalation",
    name: "Escalation Handoff",
    icon: ArrowRightLeft,
    short: "Context package for L2/Dev",
    description: "Packages full ticket context (repro steps, affected users, prior attempts) for handoff.",
  },
  {
    id: "trends",
    name: "Trends & Insights",
    icon: TrendingUp,
    short: "Weekly synthesis across tickets",
    description: "Synthesizes patterns across recent tickets — categories, SLA health, recommendations.",
  },
];
