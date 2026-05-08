# Support Copilot

AI-assisted support workflow demo for customer support and application support teams.

🚀 **Live demo:** https://support-copilot-viswathi.vercel.app

## What it does

Six task-specific AI agents covering the full support lifecycle:

1. **Ticket Triage & Routing** — severity, category, team assignment, SLA target
2. **Response Drafter** — tone-aware customer replies and stakeholder updates
3. **KB & Runbook Lookup** — relevant articles and runbooks
4. **Root Cause Analyzer** — hypotheses + diagnostic steps from logs/symptoms
5. **Escalation Handoff** — packaged context for L2/Dev/DBA handoffs
6. **Trends & Insights** — weekly synthesis across ticket volume

Built to handle **both customer-facing tickets** (billing, access, feature requests) **and application-support incidents** (API errors, database issues, auth failures) in a single workflow.

## ℹ️ Demo data disclaimer

All tickets, customer names, company names, error logs, and incident details shown in this public demo are **fictional and for illustrative purposes only**. No real customer data, proprietary information, or PII from any past employer or client is included.

## Stack

React · Vite · Tailwind CSS · Lucide Icons · deployed on Vercel

The public demo runs on canned sample outputs. A live-API version (using the Anthropic API with Claude Sonnet 4) is used by the author for daily ticket-prep work.

## Run locally

```bash
npm install
npm run dev
```

## About

Built by Viswathi Madavan as part of a Customer & Application Support portfolio.

- Portfolio: [Notion](https://developing-larkspur-3db.notion.site/)
- LinkedIn: [linkedin.com/in/viswathi-madavan](https://www.linkedin.com/in/viswathi-madavan)
- Email: m.viswathi@gmail.com
