// Canned sample outputs for each agent × ticket combination.
// All content is fictional and illustrative.

import { tickets } from "./tickets.js";

// Helper to derive plausible team based on category
function teamFor(category) {
  if (["Billing", "General Inquiry"].includes(category)) return "Tier 1 CX";
  if (["Account Access", "Bug Report", "Feature Request"].includes(category)) return "Tier 1 CX";
  if (["Auth/SSO", "API/Integration"].includes(category)) return "Tier 2 Technical";
  if (["Database/Performance", "Data Pipeline"].includes(category)) return "On-call SRE";
  return "Tier 1 CX";
}

function slaFor(priority) {
  return { P1: "15 min", P2: "1 hour", P3: "4 hours", P4: "24 hours" }[priority];
}

// ---------- Triage ----------
function triageOutput(t) {
  return {
    severity: t.priority,
    category: t.category,
    team: teamFor(t.category),
    sla_target: slaFor(t.priority),
    reasoning: triageReason(t),
  };
}

function triageReason(t) {
  const reasons = {
    "T-1001": "Single-user billing dispute, no urgency beyond standard refund SLA.",
    "T-1002": "Time-sensitive access issue — paying Business-tier customer with imminent meeting elevates to P2.",
    "T-1003": "Non-blocking enhancement request, low urgency, route to Product backlog.",
    "T-1004": "Single-user SSO error blocking onboarding but not production access; standard technical triage.",
    "T-1005": "Data correctness issue affecting Enterprise-tier reporting — elevated to P2.",
    "T-1006": "Pre-sales question, route to Account Management with typical response window.",
    "T-1007": "Production outage with customer impact — automatic P1, page on-call SRE immediately.",
    "T-1008": "Enterprise integration broken, customer-side OAuth misconfig likely. Tier 2 Technical with 1h SLA.",
    "T-1009": "Performance regression affecting Enterprise tier with reproducible pattern. P2 to SRE.",
    "T-1010": "Enterprise SSO outage blocking 200+ users — P1, immediate page to on-call.",
    "T-1011": "Trend signal, no SLA breach yet. Worth investigating proactively.",
    "T-1012": "Intermittent customer-impacting delivery delay; pipeline issue suspected.",
  };
  return reasons[t.id] || "Standard triage classification.";
}

// ---------- Response Drafter ----------
function drafterOutput(t) {
  const isInternal = t.channel === "pagerduty" || t.channel === "internal-monitoring";
  return {
    audience: isInternal ? "stakeholder" : "customer",
    tone: isInternal ? "urgent / professional" : t.priority === "P2" ? "empathetic / urgent" : "empathetic / professional",
    draft_reply: drafterReply(t, isInternal),
    missing_info: drafterMissing(t),
  };
}

function drafterReply(t, isInternal) {
  const replies = {
    "T-1001": `Hi Riley,\n\nThanks for flagging this — I can see two charges of $49 on May 1st on your account. You're right, that's a duplicate. I've initiated a refund for the second charge; you should see it on the card ending 4421 within 5–7 business days.\n\nI've also added a note to your account so this doesn't recur. Let me know if anything else looks off.\n\nBest,\nSupport`,
    "T-1002": `Hi Marcus,\n\nI hear you — board presentation in 30 minutes is high-stakes. I'm working on this now.\n\nIt looks like the reset link may have expired or been used twice. I'm sending a fresh reset link to your registered email right now and will stay on this chat until you're back in. If the new link doesn't work within 2 minutes, reply here and I'll switch to a manual reset.\n\nWe'll get you in.\nSupport`,
    "T-1003": `Hi Aisha,\n\nGreat suggestion — bulk export is one of our most-requested enhancements and it's on the roadmap. I've added your use case (12+ reports for monthly board prep) to the feature ticket so the product team has the full context.\n\nI'll follow up when there's a target ship window. In the meantime, if you're open to a workaround, I can show you a CSV export approach via our API that handles the batch in one call.\n\nThanks,\nSupport`,
    "T-1007": `[INCIDENT UPDATE — 11:36 UTC]\n\nStatus: Investigating\nImpact: /api/v2/events returning 503 for ~15% of requests, started 11:28 UTC\nAffected customers: 3 tickets opened, monitoring for more\nWorking theory: TLS handshake timeouts to event-ingest cluster, circuit breaker open\n\nNext update: 11:50 UTC or sooner if status changes.\n\nOn-call: [name]`,
    "T-1010": `[P1 — SSO OUTAGE — 7:50 UTC]\n\nCustomer: Sterling Manufacturing\nImpact: 200+ users unable to log in via SAML\nRoot cause hypothesis: IdP signing cert rotation last night not properly picked up on our side\nETA to mitigation: 30 min (validating cert metadata, manual re-import if needed)\n\nAM is on the call with their CIO. Next update at 8:10 UTC.`,
  };
  if (replies[t.id]) return replies[t.id];

  if (isInternal) {
    return `[${t.priority} — ${t.title.replace(/\[.*?\]\s*/, "")}]\n\nStatus: Acknowledged, investigating.\nImpact: ${t.body.split("\n")[0].slice(0, 120)}…\nNext update: in 30 minutes or sooner.`;
  }
  return `Hi ${t.customer.name.split(" ")[0]},\n\nThanks for reaching out. I've reviewed the details you shared and I'm looking into it now. I'll follow up within our SLA window with either a resolution or an update on what we're seeing.\n\nIn the meantime, if anything changes on your end please reply to this thread.\n\nBest,\nSupport`;
}

function drafterMissing(t) {
  const map = {
    "T-1001": ["Confirm the customer's preferred refund destination if not the original card"],
    "T-1004": ["Confirm whether the new analyst is in the correct Okta group mapped to our app"],
    "T-1005": ["Time window of the data export they're comparing against"],
    "T-1008": ["Required OAuth scope list (need to confirm with Integrations team)"],
    "T-1009": ["Specific record-count threshold where timeout starts (10k? 15k?)"],
  };
  return map[t.id] || ["No critical info missing — safe to send draft."];
}

// ---------- KB Lookup ----------
function kbOutput(t) {
  const map = {
    "T-1001": [
      { title: "Processing duplicate charge refunds", relevance: "high", snippet: "Standard SOP for verifying and refunding duplicate subscription charges via the billing dashboard.", article_type: "internal runbook" },
      { title: "Customer-facing FAQ: Why was I charged twice?", relevance: "medium", snippet: "Public help-center article with self-service refund request flow.", article_type: "customer-facing KB" },
      { title: "Stripe webhook reconciliation guide", relevance: "low", snippet: "Engineering runbook for diagnosing duplicate-charge root causes upstream.", article_type: "internal runbook" },
    ],
    "T-1002": [
      { title: "Password reset link troubleshooting", relevance: "high", snippet: "Common causes: expired link (60min TTL), link already used, browser cache.", article_type: "internal runbook" },
      { title: "Manual password reset by support agent", relevance: "high", snippet: "How to issue a force-reset from the admin panel when self-serve fails.", article_type: "internal runbook" },
      { title: "Account lockout policies", relevance: "medium", snippet: "Auto-lockout triggers after 5 failed attempts within 10 minutes.", article_type: "customer-facing KB" },
    ],
    "T-1007": [
      { title: "Runbook: event-ingest cluster TLS failures", relevance: "high", snippet: "Step-by-step for diagnosing handshake timeouts. Check upstream LB cert expiry first.", article_type: "internal runbook" },
      { title: "Circuit breaker behavior — when to manually reset", relevance: "high", snippet: "Criteria for forcing circuit breaker closed vs waiting for half-open recovery.", article_type: "internal runbook" },
      { title: "Past incident: 2026-03-12 event-ingest 503s", relevance: "medium", snippet: "Similar symptoms — root cause was expired intermediate cert in cert chain.", article_type: "internal runbook" },
    ],
    "T-1010": [
      { title: "SAML cert rotation procedure", relevance: "high", snippet: "Steps for IdP cert rotation including the metadata refresh trigger that's required on our side.", article_type: "internal runbook" },
      { title: "Past incident: 2026-01-22 cert validation failures", relevance: "high", snippet: "Same symptom class. Root cause: metadata XML cached, manual cache flush resolved.", article_type: "internal runbook" },
      { title: "SSO config admin guide", relevance: "medium", snippet: "Customer-facing guide on uploading new IdP metadata.", article_type: "customer-facing KB" },
    ],
  };
  if (map[t.id]) return map[t.id];
  // Generic fallback
  return [
    { title: `${t.category}: common issues and fixes`, relevance: "high", snippet: `Top reference article for the ${t.category} category.`, article_type: "internal runbook" },
    { title: `Customer-facing FAQ: ${t.category}`, relevance: "medium", snippet: "Self-service help-center article with diagnostic checklist.", article_type: "customer-facing KB" },
    { title: `${t.category} escalation criteria`, relevance: "low", snippet: "When to escalate from L1 to L2 for this category.", article_type: "internal runbook" },
  ];
}

// ---------- Root Cause ----------
function rcaOutput(t) {
  const map = {
    "T-1001": {
      hypotheses: [
        { cause: "Webhook retry from payment processor caused a second charge to be recorded against the same subscription", confidence: "high", evidence: "Two identical charges on the same day with identical descriptions strongly suggest a billing-side duplicate, not customer-initiated double purchase" },
        { cause: "Customer completed checkout twice (e.g. browser back button after a perceived failed first attempt)", confidence: "medium", evidence: "Less likely given identical timestamps but worth ruling out before refunding" },
      ],
      diagnostic_steps: [
        "Pull billing event log for Riley's account on May 1st — look for two `charge.succeeded` events with the same subscription_id",
        "Check if a `charge.failed` immediately preceded the second charge (indicates retry, not user action)",
        "Verify only one active subscription exists on the account",
      ],
      data_to_gather: ["Stripe (or billing provider) charge IDs for both transactions", "Subscription ID and account ID", "Webhook delivery log for May 1st"],
    },
    "T-1002": {
      hypotheses: [
        { cause: "Password reset token was consumed by the first reset confirmation and the user is now attempting to use the same link or new password while the session is still in an inconsistent state", confidence: "high", evidence: "User explicitly says neither the new password nor the reset link works — points to token/session state issue, not credential validation" },
        { cause: "Browser autofill submitting the old password, generating 'invalid credentials' errors instead of using the new one", confidence: "medium", evidence: "Very common on Macs with Safari's saved credentials" },
        { cause: "Account hit the 5-failed-attempt auto-lockout threshold from earlier wrong-password attempts", confidence: "low", evidence: "Would explain repeated 'invalid credentials' even with correct password" },
      ],
      diagnostic_steps: [
        "Check Marcus's account in admin panel for active lockout flag",
        "Force-issue a fresh password reset and have him use an incognito window to remove autofill from the equation",
        "If still failing, do a manual admin-side password reset and provide a temporary credential",
      ],
      data_to_gather: ["Account lockout status", "Last 10 sign-in attempts (timestamps + outcomes)", "Browser/device he's using"],
    },
    "T-1003": {
      hypotheses: [
        { cause: "Current single-export design creates compounding friction for batch-export use cases (monthly reporting, board prep, audits)", confidence: "high", evidence: "Customer explicitly cites 12+ exports per month and quantifies time saved — pattern likely repeats across other power users" },
        { cause: "Underlying export endpoint may already support batching at the API level but isn't surfaced in the UI", confidence: "medium", evidence: "Worth checking with engineering — if true, this is a UI-only fix rather than a backend feature build" },
      ],
      diagnostic_steps: [
        "Search support history for similar bulk-export requests in last 6 months to estimate request frequency",
        "Confirm with engineering whether /api/v2/reports/export already supports multi-ID batch input",
        "If batch API exists: propose a quick UI improvement (multi-select + 'export as zip')",
      ],
      data_to_gather: ["Count of similar feature requests in last 6 months", "API capability check from engineering", "Estimated implementation effort if API-only vs full feature"],
    },
    "T-1004": {
      hypotheses: [
        { cause: "User exists in Okta but not in the group/app assignment that maps to our SSO connection", confidence: "high", evidence: "AADSTS50105 specifically maps to 'user not in group/app assignment' even when user exists in directory" },
        { cause: "Username/email mismatch between Okta record and our app's expected attribute", confidence: "medium", evidence: "Other team members work fine, suggesting connection is healthy overall" },
      ],
      diagnostic_steps: [
        "Have customer's Okta admin verify the user is assigned to our app in Okta admin > Applications > [our app] > Assignments",
        "If assigned, confirm the user's primary email in Okta exactly matches the email they're using to sign in",
        "Check our SSO logs for the specific failed sign-in attempt to confirm which attribute is missing",
      ],
      data_to_gather: ["Screenshot of Okta user assignment for our app", "Exact email used in sign-in attempt", "Timestamp of failed attempt for log lookup"],
    },
    "T-1005": {
      hypotheses: [
        { cause: "Materialized view or dashboard aggregation cache not refreshing in sync with raw data, causing stale numbers in the UI while exports query fresh", confidence: "high", evidence: "8% delta is specific enough to suggest exactly one day of missing data — classic stale-aggregation pattern" },
        { cause: "Timezone boundary mismatch between dashboard query (UTC) and export query (customer-local) causing one day to fall in/out of the week window inconsistently", confidence: "medium", evidence: "Would also produce a ~one-day delta and would manifest exactly at week boundaries (Monday reporting)" },
        { cause: "Recent dashboard query deployment changed the WAU calculation without backfilling historical aggregations", confidence: "low", evidence: "Worth checking deploy history but would typically affect more than just one week" },
      ],
      diagnostic_steps: [
        "Compare the dashboard's stored WAU value against a fresh SQL count from raw events for the same week and timezone",
        "Check the refresh schedule and last successful run of the WAU materialized view",
        "Pull deploy history for the dashboard query layer over the last 7 days",
      ],
      data_to_gather: ["Helix Health workspace ID", "Exact dashboard WAU value vs export value for the questioned week", "Materialized view last-refreshed timestamp"],
    },
    "T-1006": {
      hypotheses: [
        { cause: "Customer wants concrete feature differentiators (and likely pricing impact) rather than marketing copy", confidence: "high", evidence: "Specifically asks 'what does that unlock' — they've already read the pricing page and need substance" },
        { cause: "SSO requirement is likely the actual driver — Business tier mentions it, Pro doesn't", confidence: "medium", evidence: "Two-week decision window and the specific mention of SSO suggests procurement or IT-security alignment in motion" },
      ],
      diagnostic_steps: [
        "Check account size and usage patterns for Linden & Bow — gives signal on whether Business is genuinely the right tier or oversold",
        "Prepare a concrete feature delta document (not pricing page rehash) covering: SSO providers supported, analytics features unlocked, user/seat limits, support SLA",
        "Loop in Account Management for a 30-minute walkthrough call within the 2-week window",
      ],
      data_to_gather: ["Account usage stats for last 90 days", "Existing Pro plan features being heavily used", "Any SSO provider context (Okta? Azure AD?)"],
    },
    "T-1007": {
      hypotheses: [
        { cause: "Expired or rotated TLS cert on the event-ingest upstream load balancer", confidence: "high", evidence: "TLS handshake timeout error, no recent deploys, normal pod metrics — points to upstream/network layer" },
        { cause: "Intermediate cert chain incomplete after recent infrastructure update", confidence: "medium", evidence: "Past similar incident (2026-03-12) had this exact root cause" },
        { cause: "Network policy or security group change affecting cluster egress", confidence: "low", evidence: "Less likely given partial (15%) failure rate" },
      ],
      diagnostic_steps: [
        "Check cert expiry on event-ingest LB: `openssl s_client -connect event-ingest.internal:443 -showcerts`",
        "Verify full cert chain integrity (intermediate + root)",
        "Pull recent CloudTrail / network policy changes in last 24h",
        "If cert is the issue, follow runbook for emergency cert renewal",
      ],
      data_to_gather: ["Cert expiry dates for event-ingest LB and any intermediate", "Last cert rotation log entry", "Recent infrastructure change tickets"],
    },
    "T-1008": {
      hypotheses: [
        { cause: "Salesforce admin removed the `salesforce.read.objects.full` scope (or its equivalent) from the connected app during Monday's security review, narrowing the scope of issued tokens", confidence: "high", evidence: "Error message explicitly says the token does not include the required scope; timing aligns precisely with their stated Monday change" },
        { cause: "Cached access token on our side was issued before the scope change and is still in use — needs forced re-auth on customer side", confidence: "medium", evidence: "Likely to be true regardless of root cause; will need re-auth as part of the fix" },
        { cause: "Salesforce API version mismatch unrelated to scopes", confidence: "low", evidence: "Would typically produce a different error code; only worth ruling out" },
      ],
      diagnostic_steps: [
        "Confirm the exact OAuth scope our Salesforce integration requires (validate against the Integrations team's documentation)",
        "Send Vela Robotics the required scope list with instructions to add it to their connected app",
        "After they restore the scope, instruct them to disconnect-and-reconnect the integration to force a fresh token with the correct scopes",
      ],
      data_to_gather: ["Our official required-scope list for Salesforce integration", "Vela Robotics' current connected app scope list (from their Salesforce admin)", "Timestamp of last successful sync before failure"],
    },
    "T-1009": {
      hypotheses: [
        { cause: "N+1 query or missing index on workspace summary endpoint, exposed at scale", confidence: "high", evidence: "Threshold-based behavior (works under 10k records, fails over) is classic for query inefficiency" },
        { cause: "CDN/edge timeout (60s default) being hit due to slow origin response", confidence: "medium", evidence: "504 from CDN suggests origin is slow but reachable" },
      ],
      diagnostic_steps: [
        "Check APM trace for /api/v2/workspaces/{id}/summary on a large workspace",
        "Run EXPLAIN on the underlying query for a 10k+ record workspace",
        "Confirm CDN timeout setting and compare to actual origin response time",
      ],
      data_to_gather: ["APM trace for an affected workspace", "Query plan for workspace summary aggregation", "Origin response time distribution"],
    },
    "T-1010": {
      hypotheses: [
        { cause: "Cached SAML metadata not refreshed after customer's IdP cert rotation", confidence: "high", evidence: "Customer rotated cert last night and uploaded new metadata; signature validation failing strongly suggests stale cached cert in our SAML config" },
        { cause: "New cert uploaded but not parsed correctly (format issue)", confidence: "medium", evidence: "Possible if customer pasted PEM content rather than uploading file" },
      ],
      diagnostic_steps: [
        "Pull current SAML config for Sterling Manufacturing — confirm which cert is being used to validate signatures",
        "Compare loaded cert fingerprint against the one in the new IdP metadata XML they uploaded",
        "If mismatch: trigger manual metadata refresh per runbook",
        "If match but still failing: check SAML XML signature canonicalization differences",
      ],
      data_to_gather: ["Current cert fingerprint in our SAML config", "New cert fingerprint from their uploaded metadata", "Sample failing SAML response XML"],
    },
    "T-1011": {
      hypotheses: [
        { cause: "Customer growth over the last quarter is outpacing the static worker pool — natural scaling pressure, not a regression", confidence: "high", evidence: "20% week-over-week is consistent with steady customer onboarding, and worker count has been unchanged" },
        { cause: "One or more new report types or background jobs added in the last 3 weeks consuming a disproportionate share of worker capacity", confidence: "medium", evidence: "Coincidental timing with the start of the trend; worth checking job-type distribution" },
        { cause: "A specific large customer running batch operations that didn't exist 3 weeks ago", confidence: "low", evidence: "Single-customer driver is less likely given the smooth weekly trend but possible" },
      ],
      diagnostic_steps: [
        "Pull queue depth by job type for the last 4 weeks — look for any job type whose share has grown significantly",
        "Check customer-by-customer job submission volume over the same period",
        "Calculate current p95 job duration and worker utilization — confirm whether more workers are actually needed or if a few slow jobs are the bottleneck",
      ],
      data_to_gather: ["Queue depth time-series by job type", "Top 10 customers by reports-queue job count over last 4 weeks", "Worker utilization graph"],
    },
    "T-1012": {
      hypotheses: [
        { cause: "Webhook delivery worker pool saturation during peak hours", confidence: "medium", evidence: "Intermittent 1-in-4 pattern suggests intermittent capacity issue, not endpoint or routing" },
        { cause: "Retry backoff getting triggered on transient delivery failures", confidence: "medium", evidence: "5–10 min delays match typical exponential backoff windows" },
        { cause: "Specific event-type or customer-segment routing through a slower path", confidence: "low", evidence: "Worth checking if the delayed deliveries cluster around a specific event type" },
      ],
      diagnostic_steps: [
        "Pull webhook delivery metrics for Maple Loop's account: success rate, p95 delivery latency, retry count over last 7 days",
        "Check if delays correlate with specific event types or times of day",
        "Review worker pool capacity vs throughput in same window",
      ],
      data_to_gather: ["Per-customer webhook delivery latency distribution", "Worker pool utilization graphs", "Event type breakdown of delayed deliveries"],
    },
  };
  if (map[t.id]) return map[t.id];

  // Fallback (should never trigger now that all 12 tickets are covered)
  return {
    hypotheses: [
      { cause: `Most common root cause for ${t.category} tickets in this severity range`, confidence: "medium", evidence: "Pattern-matched against historical ticket data." },
      { cause: "Customer-side configuration drift", confidence: "low", evidence: "Worth ruling out before deeper investigation." },
    ],
    diagnostic_steps: [
      "Reproduce the issue in a controlled environment if possible",
      "Pull relevant logs for the affected user/account in the time window",
      "Check for recent config or deploy changes that could correlate",
    ],
    data_to_gather: ["Account ID and user ID", "Exact timestamp of issue", "Browser/client version if applicable"],
  };
}

// ---------- Escalation ----------
function escalationOutput(t) {
  const map = {
    "T-1007": {
      one_line_summary: "Production /api/v2/events returning 503 to ~15% of requests due to TLS handshake timeouts at event-ingest cluster, started 11:28 UTC.",
      affected_users: "All customers using events API — 3 tickets so far, broader impact likely",
      reproduction_steps: ["Send POST to /api/v2/events repeatedly", "~15% of requests return 503 with upstream TLS handshake timeout"],
      what_we_tried: ["Confirmed no recent deploys", "Checked CPU/mem on event-ingest pods (normal)", "Confirmed circuit breaker is open and fail-fast active"],
      what_we_need: "On-call SRE to investigate event-ingest LB cert chain and run manual cert validation per runbook. Likely needs cert renewal or chain fix.",
      urgency_justification: "P1 — production outage with customer impact, growing ticket count.",
    },
    "T-1010": {
      one_line_summary: "SAML signature validation failing for 200+ Sterling Manufacturing users after their IdP cert rotation last night.",
      affected_users: "All 200+ Sterling Manufacturing users — fully blocked from login since 7am UTC",
      reproduction_steps: ["Sterling user attempts SAML login", "Receives 'SAML response signature validation failed'", "Repeats for all users in their tenant"],
      what_we_tried: ["Confirmed customer rotated cert and uploaded new metadata yesterday evening", "Visually verified upload appears successful in admin UI"],
      what_we_need: "Auth team to compare loaded cert fingerprint against new metadata fingerprint and force a metadata cache refresh if mismatched. Past incident 2026-01-22 had identical root cause.",
      urgency_justification: "P1 — Enterprise customer fully blocked, CIO on the call with AM, 200+ users impacted.",
    },
  };
  if (map[t.id]) return map[t.id];

  return {
    one_line_summary: `${t.title} — ${t.priority} severity, ${t.category} category.`,
    affected_users: t.customer.tier === "n/a" ? "Internal" : `${t.customer.company} (${t.customer.tier} tier)`,
    reproduction_steps: ["See ticket body for full reproduction details", "Confirm with customer if any additional steps are needed"],
    what_we_tried: ["Initial triage and categorization complete", "Customer information gathered"],
    what_we_need: `Tier 2 review of the issue, with focus on ${t.category} expertise.`,
    urgency_justification: t.priority === "P1" || t.priority === "P2"
      ? `${t.priority} priority — within SLA escalation criteria.`
      : "Non-urgent escalation for visibility and assignment.",
  };
}

// ---------- Trends (one global output, not per-ticket) ----------
export const trendsOutput = {
  top_categories: [
    { category: "API/Integration", count: 2, note: "One P1 production incident, one P2 customer integration" },
    { category: "Auth/SSO", count: 2, note: "One P1 enterprise outage, one P3 onboarding issue" },
    { category: "Database/Performance", count: 2, note: "Trending — worth a deeper look at scaling patterns" },
    { category: "Billing", count: 1 },
    { category: "Account Access", count: 1 },
    { category: "Bug Report", count: 1 },
  ],
  emerging_patterns: [
    "Two P1 incidents in the same morning (TLS handshake on event-ingest, SAML cert validation) — both related to certificate management. Recommend an audit of cert rotation runbooks and automated cert-expiry monitoring.",
    "Database/performance issues showing up at the high-volume end of customer accounts — proactive monitoring of query performance for >10k-record workspaces could prevent escalations.",
    "SSO/Auth tickets disproportionately Enterprise-tier — these customers expect faster resolution; consider dedicated runbook coverage.",
  ],
  sla_health: "P1 incidents responded within 15-minute SLA. P2 tickets generally on track. One P3 (T-1004 Okta SSO) approaching 4-hour mark — recommend reassignment if not picked up in next 30 min.",
  recommendations: [
    "Cert management audit: schedule a review of upstream LB and SAML cert rotation procedures, including automated 30-day expiry alerts.",
    "Performance baseline: create a synthetic monitor for /api/v2/workspaces/{id}/summary at the 10k-record threshold to catch regressions earlier.",
    "Webhook delivery: investigate the intermittent 5–10 min delay pattern reported by Maple Loop — could indicate worker pool capacity issue worth pre-emptive scaling.",
  ],
  notable_outliers: [
    "T-1011: Internal monitoring flagged Sidekiq queue depth growing 20% week-over-week. No customer impact yet but worth an engineering deep-dive before it becomes an outage.",
  ],
};

// ---------- Aggregator ----------
export function getOutputsForTicket(ticketId) {
  const t = tickets.find(x => x.id === ticketId);
  if (!t) return null;
  return {
    triage: triageOutput(t),
    drafter: drafterOutput(t),
    kb: kbOutput(t),
    rca: rcaOutput(t),
    escalation: escalationOutput(t),
    trends: trendsOutput,
  };
}
