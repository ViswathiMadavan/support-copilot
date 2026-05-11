import { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
// DEMO MODE — Pre-built realistic responses (no API key needed).
// The UI, prompt engineering, and architecture are all real.
// In production, callClaude() would hit the Anthropic API.
// ═══════════════════════════════════════════════════════════════

const SYSTEM_PROMPTS = {
  triage: `You are an AI Ticket Triage Agent for Swing Education...`,
  response: `You are an AI Response Drafting Agent for Swing Education's support team. You write empathetic, clear, and warm support responses for substitute teachers and school administrators.

  Important: You do NOT investigate or invent facts. The agent provides you with (1) the original ticket and (2) their investigation notes — what they found, what they fixed, what comes next. Your job is to turn those facts into a well-structured, empathetic response.
  
  Voice principles:
  - Warm: Talk like a supportive colleague, not a corporate machine
  - Clear: Simple, direct language, no jargon
  - Empathetic: Acknowledge the feeling BEFORE the solution
  - Proactive: Anticipate the next question
  - Honest: Use only the facts the agent provided. Never invent details.
  
  You will receive a ticket, the agent's investigation notes, and the requested channel (email or chat). Draft accordingly.
  
  For EMAIL: Full paragraphs, 100-200 words, include subject line, sign off as "[Agent Name] - Swing Education Support"
  For CHAT: Short messages, 1-3 sentences each, friendly-casual tone`,
  summarize: `You are an AI Interaction Summarization Agent for Swing Education...`,
  sentiment: `You are an AI Sentiment Analysis Agent for Swing Education...`,
  knowledge: `You are an AI Knowledge Base Agent for Swing Education...`,
  report: `You are an AI Weekly Report Generator for Swing Education...`,
};

// ─── SAMPLE DATA ───
const SAMPLE_TICKETS = [
  'I worked at Lincoln Elementary last Monday and Tuesday but I only see one day on my pay statement. This is really frustrating - I need that money to pay rent this week. Can someone please look into this ASAP?',
  "Hi, I'm a new substitute and submitted my background check 12 days ago. I still haven't heard anything. Is my application stuck? I'm really eager to start working.",
  "This is unacceptable. I confirmed a sub for today and NO ONE showed up. I have 30 kids with no teacher right now. This is the third time this has happened. I'm seriously considering finding another service.",
  "The app keeps crashing every time I try to accept a job. I've missed three assignments this week because of this. So frustrating!",
  'Hi! I just completed my first assignment yesterday. When should I expect to get paid? Also, how do I set up direct deposit?',
  'I received negative feedback from a school but I have no idea what I did wrong. The day went fine as far as I could tell. Can someone explain what happened?',
  "I've been with Swing for 2 years but lately there are barely any jobs in my area. Everything is waitlisted before I even see it. I'm thinking about switching to another service.",
  'We need a sub for tomorrow morning, 3rd grade, 8am-3pm. The regular teacher has a family emergency. Please help us find someone quickly!',
];

const SAMPLE_METRICS = `Weekly Support Metrics - Feb 10-16, 2026:
- Total tickets: 847 (down 6% from 901 last week)
- Payment tickets: 212 (25%, down 8%)
- App/Technical tickets: 152 (18%, UP 12%)
- Onboarding tickets: 119 (14%, down 15%)
- School Admin tickets: 93 (11%, up 5%)
- Avg First Response Time: 1h 42m (target: <2h) ✓
- CSAT: 4.1/5.0 (target: 4.2) - close but not there
- First Contact Resolution: 68% (target: 70%)
- Help Center views: 3,420 (up 22%)
- Self-service rate: 54% (target: 60%)
- Top 'no results' search: "holiday pay" (89 searches)
- Monday had 187 tickets vs midweek avg of 125`;

// ─── STYLES ───
const colors = {
  bg: '#0a0f1a',
  surface: '#111827',
  surfaceLight: '#1f2937',
  border: '#374151',
  accent: '#10b981',
  accentDark: '#059669',
  accentGlow: 'rgba(16,185,129,0.15)',
  text: '#f9fafb',
  textMuted: '#9ca3af',
  textDim: '#6b7280',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f59e0b',
  red: '#ef4444',
  pink: '#ec4899',
};
const priorityColors = { P1: colors.red, P2: colors.orange, P3: colors.accent };
const sentimentColors = {
  Angry: colors.red,
  Frustrated: colors.orange,
  Neutral: colors.textMuted,
  Satisfied: colors.blue,
  Happy: colors.accent,
  Positive: colors.accent,
};

// ═══════════════════════════════════════════════════════════════
// DEMO RESPONSE ENGINE — matches input keywords to realistic
// pre-built outputs. In production, replace with real API call.
// ═══════════════════════════════════════════════════════════════

function detectScenario(text) {
  const t = text.toLowerCase();
  if (t.includes('lincoln') || (t.includes('pay') && t.includes('rent')))
    return 'pay_missing';
  if (t.includes('background check')) return 'bg_check';
  if (
    t.includes('no one showed up') ||
    t.includes('30 kids') ||
    t.includes('unacceptable')
  )
    return 'no_show';
  if (t.includes('crashing') || (t.includes('app') && t.includes('missed')))
    return 'app_crash';
  if (
    t.includes('first assignment') ||
    (t.includes('paid') && t.includes('direct deposit'))
  )
    return 'new_sub';
  if (t.includes('negative feedback')) return 'feedback';
  if (
    t.includes('switching to another service') ||
    t.includes('barely any jobs')
  )
    return 'retention';
  if (t.includes('need a sub') || t.includes('family emergency'))
    return 'school_urgent';
  return 'default';
}

const TRIAGE_RESPONSES = {
  pay_missing: {
    category: 'Payment & Earnings',
    subcategory: 'Missing day on pay statement',
    priority: 'P1',
    user_type: 'Substitute Teacher',
    sentiment: 'Frustrated',
    route_to: 'Payments Queue',
    suggested_article: 'Why is a day missing from my pay statement?',
    auto_response:
      "Thanks for reaching out — I'm pulling your assignment record now and will have an answer within a few hours.",
    escalation_needed: false,
    escalation_reason: null,
    summary:
      'Substitute reporting one of two days worked missing from pay statement; rent timing makes this urgent.',
  },
  bg_check: {
    category: 'Onboarding & Background Check',
    subcategory: 'Status inquiry',
    priority: 'P2',
    user_type: 'Substitute Teacher',
    sentiment: 'Neutral',
    route_to: 'Onboarding Queue',
    suggested_article: 'How long does the background check take?',
    auto_response:
      "Thanks for checking in — I'll look up your status and reply within 24 hours.",
    escalation_needed: false,
    escalation_reason: null,
    summary:
      'New sub asking about pending background check at day 12; within normal range.',
  },
  no_show: {
    category: 'Cancellation & Reliability',
    subcategory: 'Confirmed sub no-show',
    priority: 'P1',
    user_type: 'School Administrator',
    sentiment: 'Angry',
    route_to: 'Admin Priority Queue',
    suggested_article: 'Reporting a no-show',
    auto_response:
      "I'm so sorry — escalating to our admin priority team now. Someone will reach out via text within 15 minutes for emergency coverage.",
    escalation_needed: true,
    escalation_reason:
      'Third no-show + active classroom uncovered + retention risk (mentioned switching services).',
    summary:
      'School admin reporting third confirmed-sub no-show; classroom currently uncovered; retention at risk.',
  },
  app_crash: {
    category: 'App & Technical',
    subcategory: 'App crash on accept',
    priority: 'P2',
    user_type: 'Substitute Teacher',
    sentiment: 'Frustrated',
    route_to: 'Technical Queue',
    suggested_article: 'Troubleshooting app crashes when accepting jobs',
    auto_response:
      'I hear you — missing assignments because of the app is incredibly frustrating. Pulling your device info now; reply within 2 hours.',
    escalation_needed: false,
    escalation_reason: null,
    summary:
      'Sub reporting repeated app crashes when accepting; lost 3 assignments this week.',
  },
  new_sub: {
    category: 'Payment & Earnings',
    subcategory: 'Pay schedule + direct deposit setup',
    priority: 'P3',
    user_type: 'Substitute Teacher',
    sentiment: 'Positive',
    route_to: 'General Queue',
    suggested_article: 'Getting paid: pay schedule and direct deposit setup',
    auto_response:
      'Welcome to Swing! Sending you everything on pay timing and direct deposit setup right away.',
    escalation_needed: false,
    escalation_reason: null,
    summary:
      'New sub completed first assignment, asking about pay timing and direct deposit setup.',
  },
  feedback: {
    category: 'Feedback & Quality',
    subcategory: 'Negative feedback inquiry',
    priority: 'P3',
    user_type: 'Substitute Teacher',
    sentiment: 'Frustrated',
    route_to: 'General Queue',
    suggested_article: 'Understanding school feedback',
    auto_response:
      'I get how confusing feedback without context is. Looking into the specifics; reply within 48 hours.',
    escalation_needed: false,
    escalation_reason: null,
    summary:
      'Sub received negative school feedback without explanation, wants context to improve.',
  },
  retention: {
    category: 'Account & Profile',
    subcategory: 'Job availability / retention risk',
    priority: 'P2',
    user_type: 'Substitute Teacher',
    sentiment: 'Frustrated',
    route_to: 'General Queue',
    suggested_article: 'Why am I seeing fewer assignments?',
    auto_response:
      "Thank you for being with Swing for 2 years — that means a lot. Reviewing your area's assignment patterns; reply within 24 hours.",
    escalation_needed: true,
    escalation_reason:
      '2-year sub explicitly considering churn; warrants retention outreach.',
    summary:
      'Long-tenured sub frustrated by job scarcity; explicit churn signal.',
  },
  school_urgent: {
    category: 'Assignment & Scheduling',
    subcategory: 'Urgent next-day fill',
    priority: 'P1',
    user_type: 'School Administrator',
    sentiment: 'Neutral',
    route_to: 'Scheduling Queue',
    suggested_article: 'Posting urgent assignments',
    auto_response:
      'On it — pushing your request to nearby Swing Heroes right now; confirming coverage within the hour.',
    escalation_needed: false,
    escalation_reason: null,
    summary:
      'School admin needs 3rd-grade sub for full day tomorrow due to teacher family emergency.',
  },
  default: {
    category: 'General',
    subcategory: 'Inquiry',
    priority: 'P3',
    user_type: 'Substitute Teacher',
    sentiment: 'Neutral',
    route_to: 'General Queue',
    suggested_article: null,
    auto_response:
      'Thanks for reaching out — a support team member will be with you shortly.',
    escalation_needed: false,
    escalation_reason: null,
    summary: 'General support inquiry routed for review.',
  },
};

const SENTIMENT_RESPONSES = {
  pay_missing: {
    sentiment_score: 4,
    sentiment_label: 'Frustrated',
    escalation_triggers: ['really frustrating', 'ASAP', 'rent this week'],
    escalation_needed: false,
    escalation_type: 'none',
    risk_level: 'Medium',
    recommended_action:
      'Acknowledge financial urgency first, then provide a clear timeline for the pay correction.',
    tone_advice:
      'Warm and direct. Skip apologies-as-filler; show concrete next steps.',
  },
  no_show: {
    sentiment_score: 1,
    sentiment_label: 'Angry',
    escalation_triggers: [
      'unacceptable',
      'third time',
      'considering finding another service',
      '30 kids with no teacher',
    ],
    escalation_needed: true,
    escalation_type: 'immediate_p1',
    risk_level: 'Critical',
    recommended_action:
      'Immediate response from senior agent via chat or text. Find emergency coverage in parallel. Follow up with retention plan within 24 hours.',
    tone_advice:
      "Lead with ownership, not defense. Acknowledge the pattern (third time) explicitly. Do not say 'I understand your frustration.'",
  },
  retention: {
    sentiment_score: 3,
    sentiment_label: 'Frustrated',
    escalation_triggers: [
      'barely any jobs',
      'switching to another service',
      '2 years',
    ],
    escalation_needed: true,
    escalation_type: 'retention_outreach',
    risk_level: 'High',
    recommended_action:
      'Tenure-aware outreach via email and text within 24 hours. Pull regional fill data, identify expansion options, offer Swing Hero status review.',
    tone_advice:
      "Honor the 2-year history. Be honest about market conditions. Don't promise volume that doesn't exist.",
  },
  app_crash: {
    sentiment_score: 4,
    sentiment_label: 'Frustrated',
    escalation_triggers: [
      'missed three assignments',
      'every time',
      'So frustrating',
    ],
    escalation_needed: false,
    escalation_type: 'none',
    risk_level: 'Medium',
    recommended_action:
      'Collect device + OS version, escalate to engineering if iOS pattern. Offer reliability score protection for missed assignments.',
    tone_advice:
      "Validate the financial impact of missed jobs first. Engineers can wait; the sub's confidence cannot.",
  },
  new_sub: {
    sentiment_score: 8,
    sentiment_label: 'Happy',
    escalation_triggers: [],
    escalation_needed: false,
    escalation_type: 'none',
    risk_level: 'Low',
    recommended_action:
      'Welcome warmly, send pay + direct deposit info, suggest 2-3 nearby schools to favorite for steady work.',
    tone_advice:
      'Match their energy. First-week experience predicts 90-day retention.',
  },
  feedback: {
    sentiment_score: 4,
    sentiment_label: 'Frustrated',
    escalation_triggers: ['no idea what I did wrong'],
    escalation_needed: false,
    escalation_type: 'none',
    risk_level: 'Low',
    recommended_action:
      "Pull specific feedback from school, share what's shareable, offer growth resources for any pattern noted.",
    tone_advice:
      "Be honest about what we can and can't share. Position as growth, not punishment.",
  },
  bg_check: {
    sentiment_score: 6,
    sentiment_label: 'Neutral',
    escalation_triggers: [],
    escalation_needed: false,
    escalation_type: 'none',
    risk_level: 'Low',
    recommended_action:
      'Status check + clear ETA. If multi-state resident, set 14-day expectation.',
    tone_advice:
      "Reassuring without overpromising. They're eager — match the eagerness.",
  },
  school_urgent: {
    sentiment_score: 6,
    sentiment_label: 'Neutral',
    escalation_triggers: [],
    escalation_needed: false,
    escalation_type: 'none',
    risk_level: 'Low',
    recommended_action:
      'Push request to Swing Heroes in 10-mile radius immediately. Confirm fill within the hour.',
    tone_advice:
      "Calm and operational. They're stressed but not angry — be the steady hand.",
  },
  default: {
    sentiment_score: 5,
    sentiment_label: 'Neutral',
    escalation_triggers: [],
    escalation_needed: false,
    escalation_type: 'none',
    risk_level: 'Low',
    recommended_action: 'Standard response within SLA.',
    tone_advice: 'Warm, clear, helpful.',
  },
};

function mockResponseDraft(scenario, channel) {
  const responses = {
    pay_missing: {
      email: `Subject: Looking into your missing pay for Lincoln Elementary

Hi,

I'm sorry — getting paid less than expected when rent is due this week is genuinely stressful, and I want to fix this for you fast.

Here's what I found: your assignments at Lincoln Elementary on Monday and Tuesday were both completed, but Tuesday's timesheet wasn't synced before payroll ran on Friday. That's why only one day is showing.

What happens next:
1. I've already submitted the correction — Tuesday's pay will hit your account by this Friday.
2. You'll get a confirmation email when it processes.
3. I've flagged Lincoln's timesheet workflow so this doesn't repeat for you or anyone else.

If anything else looks off, just reply here — your case is open with me until you're paid in full.

Best,
Sarah - Swing Education Support`,
      chat: `Hi! I see your message about Lincoln Elementary pay — I'm on it.

Quick update: Tuesday's timesheet from Lincoln didn't sync before Friday's payroll run, which is why only Monday is showing.

I've already filed the correction. The missing day will land in your account by this Friday at the latest.

You'll get a confirmation email when it processes. Anything else I can pull up while I have your file open?`,
    },
    no_show: {
      email: `Subject: Emergency coverage request — and a real apology

Hi,

What happened today is not okay. A confirmed sub didn't show up to your school for the third time, and you've got 30 kids without a teacher right now. I'm sorry.

I'm doing two things in parallel:

1. Emergency coverage — I've just pushed your need to every Swing Hero within 10 miles with priority alerting. I'll text you in the next 15 minutes with a confirmed fill or a real backup plan.

2. Pattern review — Three no-shows is a pattern, and patterns deserve a real fix, not another apology. I'm pulling the records on all three and will have a written response back to you by tomorrow morning with what changes on our end.

You shouldn't have to consider another service. Let's get today handled first, then earn that back.

Texting you in 15.

— Sarah, Swing Education Support`,
      chat: `I'm so sorry — I see what happened. 30 kids, no teacher, third time. That's not acceptable and I'm not going to act like it is.

Right now, two things happening in parallel:

→ Pushing your request to every Swing Hero within 10 miles, priority alert
→ Pulling records on all three no-shows for a real pattern review

I'm texting you in 15 minutes with confirmed coverage or a backup plan. Stay near your phone.`,
    },
    app_crash: {
      email: `Subject: App crashes on iOS 17.4 — workaround + protected reliability score

Hi,

I'm sorry — missing assignments because the app keeps crashing is exactly the kind of thing that shouldn't be costing you work. Here's what I've confirmed and what's already in motion.

What I found: the crashes are tied to iOS 17.4 specifically, after our Feb 12 release. Engineering is investigating. You're not the only sub seeing this.

What's already done:
1. The 3 missed assignments this week have been flagged in our system — your reliability score is protected for those, no impact.
2. While we fix the bug, two workarounds: (a) force quit and reopen the app before accepting a job, or (b) use the web version at subs.swingeducation.com — same login, same job feed, no crashes.

I'll email you when the fix ships. Reply here if any other assignment gets caught up in this.

Best,
Sarah - Swing Education Support`,
      chat: `I hear you — three lost assignments because of crashes is a real problem, not a small one.

Here's where we are:

→ Crashes confirmed on iOS 17.4 after our Feb 12 release. Engineering is on it.
→ Your 3 missed assignments are flagged — reliability score is protected, no penalty.
→ Workaround until we ship the fix: force quit + reopen, OR use the web app at subs.swingeducation.com (same login, no crashes).

I'll message you when the fix is live. Anything else getting blocked, just reply.`,
    },
    bg_check: {
      email: `Subject: Quick update on your background check

Hi,

Thanks for checking in — totally fair to wonder what's going on at day 12.

Here's what I see: your check is in the California review queue with our vendor (Sterling). Because you're a multi-state resident, each state has to clear independently, which is what's adding the extra time. Expected completion is 2-3 more business days from today.

There's nothing on your end to do — the queue moves automatically and I'll email you the moment it clears so you can start picking up assignments. If anything pings me from Sterling sooner, I'll let you know.

Hang in there — almost across the line.

Best,
Sarah - Swing Education Support`,
      chat: `Thanks for checking in! Quick status on your background check:

→ It's in the CA review queue with Sterling (our vendor)
→ Multi-state residency means each state clears separately, which is what's slowing it
→ Expected completion: 2-3 more business days

Nothing for you to do — I'll message you the second it clears so you can start picking up assignments. Almost there!`,
    },
    new_sub: {
      email: `Subject: Welcome to Swing — here's how pay works

Hi!

Congratulations on your first assignment — that first day is a big one. Here's everything you asked about:

When you'll get paid: Pay runs every Friday for the previous Monday–Sunday work week. So if you worked yesterday, you'll see that pay this Friday (assuming it was Mon–Sun of last week) or next Friday (if it was this week).

Setting up direct deposit: Pay is processed through UKG (our payroll system), not the Swing app. You'll get an email from UKG with login info — once you're in, you can add or update direct deposit details there. Verification typically takes 1-2 business days. Until that's set up, your first payment will arrive as a paper check at your address on file.

Pay statements: also in the UKG app, under Pay → Pay Statements. The Swing app is just for finding and managing your assignments.

A small tip: most subs get steadier work by favoriting 3-5 nearby schools in their first month. Want me to pull a list of schools near you with active needs?

Welcome aboard,
Sarah - Swing Education Support`,
      chat: `Welcome to Swing! 🎉 Quick answers:

→ Pay runs every Friday for the prior Mon–Sun work week
→ Pay is handled in UKG (our payroll system), not the Swing app — you'll get UKG login info by email
→ Set up direct deposit inside UKG; first payment will be a paper check until that's verified (1-2 days)
→ Swing app = finding/managing assignments only

Want me to pull a list of nearby schools with active needs? Most subs get steadier work by favoriting 3-5 schools early.`,
    },
    default: {
      email: `Subject: Following up on your message

Hi,

Thanks for reaching out to Swing Support. I've received your message and I'm looking into it now.

I'll have a substantive response back to you within the next few hours. If anything else comes up in the meantime, just reply here — your case is open with me.

Best,
Sarah - Swing Education Support`,
      chat: `Hi! Thanks for reaching out — I've got your message and I'm looking into it now. I'll be back with you within the next few hours.`,
    },
  };
  const scenarioResp = responses[scenario] || responses.default;
  return scenarioResp[channel] || scenarioResp.email;
}

const KNOWLEDGE_RESPONSES = {
  cancellation: `Swing's cancellation policy uses a 24-hour rule for substitutes:

  - 24+ hours before assignment start → No impact to your reliability rating
  - Within 24 hours → Affects your reliability rating, may impact future assignment access
  - Same-day cancellation or no-show → Significant impact, repeated incidents can lead to suspension
  
  Exceptions for emergencies: medical issues, family crises, or other unavoidable situations are reviewed case-by-case — contact support directly and your reliability rating can often be protected.
  
  For schools cancelling on subs: if a school cancels a confirmed assignment within 24 hours of start time, the sub still gets paid (this is one of Swing's stronger sub protections — most platforms don't offer this).`,

  background_check: `Background checks typically take 5-10 business days, but there's some variation:

- Standard (single-state residence, clean record): 3-7 days
- Multi-state residents: 10-14 days (each state needs to be checked)
- Names with common matches: can take longer due to disambiguation
- Out-of-country residency in last 7 years: 14-21 days

If you're past day 12 and haven't heard back, that's not unusual but it's worth a status check. Contact support and we'll pull the report status from the vendor (Sterling) directly.`,
  payment: `Swing pays weekly, every Friday:

- Pay period: Monday through Sunday of the previous week
- Payment hits accounts: Friday morning (direct deposit) or 5-7 days later by mail (paper check)
- Tax forms: 1099 generated annually for subs earning $600+

Important: pay is processed through UKG, our payroll provider — not through the Swing app itself. The Swing app handles assignment matching; UKG handles paychecks, pay statements, and direct deposit setup.

To set up or update direct deposit: log into the UKG app or web portal (login info is sent to your email after onboarding) and update your account details there. Verification takes 1-2 business days.

To view pay statements: in the UKG app, tap Menu (☰) → Pay → Pay Statements. You can download PDFs of any specific pay period.

For pay discrepancies: report through Swing support at support@swingeducation.com or via chat in the help center, with the assignment date, school, and what you see vs what you expected.

Source: Swing Education Help Center`,
  hero: `Swing Hero is our recognition for top-performing substitutes:

How you become one:
- Maintain 4.5+ star rating across at least 10 assignments
- 95%+ reliability score (low cancellations, no no-shows)
- Active in the last 90 days

What you get:
- Priority notifications for new assignments (5-15 minutes earlier than other subs)
- Star badge visible to schools when they review applicants
- Priority placement for long-term and roving requests
- Some schools filter their searches to Swing Heroes only

Status is reviewed monthly. There's no application — it's automatic based on performance.`,
  favorites: `Schools build their favorites list through a feedback-based flow:

After a sub completes an assignment, the school has the option to add that sub to their favorites list. This typically happens through the school's post-assignment feedback step.

When the school next posts an assignment, they can use the "requested sub" feature to send the request to subs from their favorites list first. The sub receives an SMS or app notification that reads "You've been requested" — and the request appears in their Open Commitments to accept.

A few details worth knowing:
- Schools can request more than one sub for the same assignment, so accepting quickly matters if you're interested
- If no requested subs accept within the timeframe, the request opens to the broader pool
- Your sub profile shows a count of how many times each school has requested you
- The strongest way to land on a school's favorites is straightforward: do a great assignment, and let your school point-of-contact know you'd like to return

Source: Swing Education Help Center — "Requested substitutes and school favorites lists"`,
  default: `Hi! You've reached the demo mode of this knowledge base.

  In production, this agent would answer any Swing-related question by querying the live knowledge base via the Anthropic API. For this portfolio demo, I've pre-built realistic responses for 5 common topics — try clicking one of the suggested questions below to see how the agent handles a real query:
  
  → "What is Swing's cancellation policy?"
  → "How long does a background check take?"
  → "How does payment work?"
  → "What is a Swing Hero?"
  → "How do school admins build a favorites list?"
  
  Thanks for taking the time to explore this — Viswathi`,
};

function detectKnowledgeQuery(q) {
  const t = q.toLowerCase();
  if (t.includes('cancel')) return 'cancellation';
  if (t.includes('background')) return 'background_check';
  if (t.includes('pay') || t.includes('paid') || t.includes('direct deposit'))
    return 'payment';
  if (t.includes('hero')) return 'hero';
  if (t.includes('favorite')) return 'favorites';
  return 'default';
}

const SUMMARY_RESPONSE = {
  user_name: 'Maria Garcia',
  user_type: 'Substitute Teacher',
  channel: 'Chat',
  issue_summary:
    "Maria worked a 3-day long-term assignment at Jefferson Middle School (Feb 3–5). Pay statement shows Feb 4 as 'Not Confirmed' so she wasn't paid for that day, despite being present and observed by front office staff.",
  steps_taken:
    "Agent pulled assignment record, identified Feb 4 as unconfirmed by school, contacted Jefferson admin office directly to verify Maria's presence, updated attendance record, queued payment correction, flagged Jefferson for attendance-confirmation training.",
  resolution:
    "Jefferson confirmed Maria's presence on Feb 4. Attendance updated, missing day's pay scheduled for next pay cycle (Feb 21).",
  follow_up_actions:
    '1. Confirm pay deposit on Feb 21 via automated check. 2. Follow up with Jefferson on attendance-confirmation training. 3. Add to weekly pattern report on school-side timesheet delays.',
  sentiment: 'Started worried/anxious → ended grateful and reassured.',
  tags: [
    'payment-correction',
    'school-side-error',
    'long-term-assignment',
    'first-touch-resolution',
  ],
};

const REPORT_RESPONSE = `📊 Weekly Support Report — Feb 10–16, 2026

Headline: Ticket volume down 6% week-over-week to 847, but App/Technical tickets jumped 12% — that's the signal that needs attention.

The Win: First Response Time hit 1h 42m, beating our <2h target. This is the third consecutive week under target and reflects the auto-routing changes from January.

The Concern: App/Technical tickets are up 12% (152 tickets) while every other category is flat or down. Cross-referencing app store reviews shows a spike around the Feb 12 iOS app update. Recommend pulling that release's diff and pinging engineering by Wednesday.

Other notable signals:
- CSAT at 4.1 (target 4.2) — close but stalled for 4 weeks. Worth a deeper look at the bottom-quartile interactions.
- Help Center views up 22%, self-service rate at 54% (target 60%). The "holiday pay" search returned 89 zero-result hits — prime article gap.
- Mondays are 50% above the midweek average (187 vs 125). Worth a staffing review.

Action Items:
1. Engineering loop-in on Feb 12 iOS release re: ticket spike (Owner: Tech lead, by Wed)
2. Write the "holiday pay" KB article (Owner: KB editor, by Fri)
3. Bottom-quartile CSAT review for actionable patterns (Owner: QA lead, by next Mon)`;

// ═══════════════════════════════════════════════════════════════
// Mock router — replaces real API call in demo mode
// ═══════════════════════════════════════════════════════════════
async function callClaude(systemPrompt, userMessage) {
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 700));

  if (systemPrompt.includes('Triage')) {
    const scenario = detectScenario(userMessage);
    return JSON.stringify(TRIAGE_RESPONSES[scenario], null, 2);
  }
  if (systemPrompt.includes('Response Drafting')) {
    const scenario = detectScenario(userMessage);
    const channel = userMessage.includes('CHAT') ? 'chat' : 'email';
    return mockResponseDraft(scenario, channel);
  }
  if (systemPrompt.includes('Sentiment Analysis')) {
    const scenario = detectScenario(userMessage);
    return JSON.stringify(SENTIMENT_RESPONSES[scenario], null, 2);
  }
  if (systemPrompt.includes('Knowledge Base')) {
    const key = detectKnowledgeQuery(userMessage);
    return KNOWLEDGE_RESPONSES[key];
  }
  if (systemPrompt.includes('Summarization')) {
    return JSON.stringify(SUMMARY_RESPONSE, null, 2);
  }
  if (systemPrompt.includes('Weekly Report')) {
    return REPORT_RESPONSE;
  }
  return 'Demo response not configured for this agent.';
}

function tryParseJSON(str) {
  try {
    const cleaned = str.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ─── COMPONENTS ───
function TabButton({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 16px',
        border: 'none',
        cursor: 'pointer',
        background: active ? colors.accentGlow : 'transparent',
        color: active ? colors.accent : colors.textMuted,
        borderBottom: active
          ? `2px solid ${colors.accent}`
          : '2px solid transparent',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.2s',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span>
      {label}
    </button>
  );
}

function StatusBadge({ text, color }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        fontFamily: "'JetBrains Mono', monospace",
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {text}
    </span>
  );
}

function Card({ title, children, style: s }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '20px',
        ...s,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: colors.accent,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '14px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function LoadingDots() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const i = setInterval(
      () => setDots((d) => (d.length >= 3 ? '' : d + '.')),
      400
    );
    return () => clearInterval(i);
  }, []);
  return (
    <span
      style={{
        color: colors.accent,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      Processing{dots}
    </span>
  );
}

// ─── TRIAGE PANEL ───
function TriagePanel() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState('');

  async function run() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setRaw('');
    const resp = await callClaude(SYSTEM_PROMPTS.triage, input);
    setRaw(resp);
    setResult(tryParseJSON(resp));
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card title="Incoming Ticket">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste or type a support ticket message..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            background: colors.surfaceLight,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            color: colors.text,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={run}
            disabled={loading}
            style={{
              padding: '8px 20px',
              background: colors.accent,
              color: colors.bg,
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
            }}
          >
            {loading ? 'ANALYZING...' : '▶ TRIAGE TICKET'}
          </button>
          {SAMPLE_TICKETS.slice(0, 4).map((t, i) => (
            <button
              key={i}
              onClick={() => setInput(t)}
              style={{
                padding: '6px 12px',
                background: colors.surfaceLight,
                color: colors.textMuted,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Sample {i + 1}
            </button>
          ))}
        </div>
      </Card>

      {loading && (
        <Card>
          <LoadingDots />
        </Card>
      )}

      {result && (
        <Card title="Triage Results">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ color: colors.textDim, fontSize: '11px' }}>
                CATEGORY
              </span>
              <br />
              <StatusBadge text={result.category} color={colors.blue} />
            </div>
            <div>
              <span style={{ color: colors.textDim, fontSize: '11px' }}>
                PRIORITY
              </span>
              <br />
              <StatusBadge
                text={result.priority}
                color={priorityColors[result.priority] || colors.textMuted}
              />
            </div>
            <div>
              <span style={{ color: colors.textDim, fontSize: '11px' }}>
                SENTIMENT
              </span>
              <br />
              <StatusBadge
                text={result.sentiment}
                color={sentimentColors[result.sentiment] || colors.textMuted}
              />
            </div>
            <div>
              <span style={{ color: colors.textDim, fontSize: '11px' }}>
                ROUTE TO
              </span>
              <br />
              <StatusBadge text={result.route_to} color={colors.purple} />
            </div>
            <div>
              <span style={{ color: colors.textDim, fontSize: '11px' }}>
                USER TYPE
              </span>
              <br />
              <span style={{ color: colors.text, fontSize: '14px' }}>
                {result.user_type}
              </span>
            </div>
            <div>
              <span style={{ color: colors.textDim, fontSize: '11px' }}>
                ESCALATION
              </span>
              <br />
              <StatusBadge
                text={result.escalation_needed ? 'YES' : 'NO'}
                color={result.escalation_needed ? colors.red : colors.accent}
              />
            </div>
          </div>
          {result.summary && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                background: colors.surfaceLight,
                borderRadius: '6px',
              }}
            >
              <span style={{ color: colors.textDim, fontSize: '11px' }}>
                SUMMARY
              </span>
              <p
                style={{
                  color: colors.text,
                  margin: '6px 0 0',
                  fontSize: '14px',
                }}
              >
                {result.summary}
              </p>
            </div>
          )}
          {result.auto_response && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                background: `${colors.accent}11`,
                border: `1px solid ${colors.accent}33`,
                borderRadius: '6px',
              }}
            >
              <span
                style={{
                  color: colors.accent,
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                AUTO-RESPONSE TO SEND
              </span>
              <p
                style={{
                  color: colors.text,
                  margin: '6px 0 0',
                  fontSize: '13px',
                  fontStyle: 'italic',
                }}
              >
                {result.auto_response}
              </p>
            </div>
          )}
          {result.suggested_article && result.suggested_article !== 'null' && (
            <div style={{ marginTop: '8px' }}>
              <span style={{ color: colors.textDim, fontSize: '11px' }}>
                SUGGESTED ARTICLE:{' '}
              </span>
              <span style={{ color: colors.blue, fontSize: '13px' }}>
                {result.suggested_article}
              </span>
            </div>
          )}
        </Card>
      )}
      {!result && raw && (
        <Card title="Raw Response">
          <pre
            style={{
              color: colors.textMuted,
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {raw}
          </pre>
        </Card>
      )}
    </div>
  );
}

// ─── RESPONSE DRAFTING PANEL ───
function ResponsePanel() {
  const [ticket, setTicket] = useState('');
  const [notes, setNotes] = useState('');
  const [channel, setChannel] = useState('email');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  function loadSample(idx) {
    const samples = [
      {
        ticket: SAMPLE_TICKETS[0],
        notes:
          "Confirmed both Mon and Tue assignments at Lincoln Elementary. Tuesday timesheet not synced before Friday's payroll run. Correction filed for missing day. Pay will hit account by this Friday. Confirmation email auto-sends on processing.",
      },
      {
        ticket: SAMPLE_TICKETS[1],
        notes:
          'Background check submitted Day 12. Multi-state resident — vendor (Sterling) reports check is in CA review queue. Expected completion: 2-3 more business days. Will email status when complete. No action needed from sub.',
      },
      {
        ticket: SAMPLE_TICKETS[3],
        notes:
          'App crashes confirmed on iOS 17.4 after Feb 12 release. Engineering investigating. Workaround: force quit + reopen, or use web app at subs.swingeducation.com. Reliability score protected for the 3 missed assignments — flagged in system.',
      },
      {
        ticket: SAMPLE_TICKETS[4],
        notes:
          "First assignment completed 2/15. Pay schedule: weekly on Friday for prior Mon-Sun. Their Friday's pay will arrive 2/21 (paper check, ~5-7 days mail). Direct deposit is set up in UKG (our payroll system, separate from Swing app) — login link sent via email after onboarding.",
      },
    ];
    setTicket(samples[idx].ticket);
    setNotes(samples[idx].notes);
  }

  async function run() {
    if (!ticket.trim() || !notes.trim()) return;
    setLoading(true);
    setResult('');
    const prompt = `Channel: ${channel.toUpperCase()}\n\nTicket from user:\n"${ticket}"\n\nAgent's investigation notes (use these as the source of truth — do not invent additional facts):\n${notes}\n\nDraft a ${channel} response following Swing Education's voice guidelines.`;
    const resp = await callClaude(SYSTEM_PROMPTS.response, prompt);
    setResult(resp);
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card title="Step 1 — Support Ticket (from user)">
        <textarea
          value={ticket}
          onChange={(e) => setTicket(e.target.value)}
          placeholder="Paste the support ticket from the sub or school admin..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '12px',
            background: colors.surfaceLight,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            color: colors.text,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </Card>

      <Card title="Step 2 — Investigation Notes (from agent)">
        <div
          style={{
            fontSize: '11px',
            color: colors.textMuted,
            marginBottom: '8px',
            lineHeight: 1.5,
          }}
        >
          The AI uses these notes as facts. It will NOT invent details beyond
          what's here. Include: what you found, what you fixed, what happens
          next.
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Confirmed sub worked Mon and Tue. Tuesday timesheet didn't sync before Friday payroll. Correction filed for missing day, will hit account by Friday. Confirmation email auto-sends on processing."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '12px',
            background: colors.surfaceLight,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            color: colors.text,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginTop: '10px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              color: colors.textDim,
              fontSize: '11px',
              alignSelf: 'center',
              marginRight: '4px',
            }}
          >
            Load sample:
          </span>
          {[0, 1, 2, 3].map((i) => (
            <button
              key={i}
              onClick={() => loadSample(i)}
              style={{
                padding: '4px 10px',
                background: colors.surfaceLight,
                color: colors.textMuted,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {['Pay missing', 'BG check', 'App crash', 'New sub'][i]}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Step 3 — Channel & Generate">
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {['chat', 'email'].map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              style={{
                padding: '6px 16px',
                borderRadius: '4px',
                border: `1px solid ${
                  channel === c ? colors.accent : colors.border
                }`,
                background: channel === c ? colors.accentGlow : 'transparent',
                color: channel === c ? colors.accent : colors.textMuted,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                fontWeight: channel === c ? 700 : 400,
              }}
            >
              {c === 'chat' ? '💬 Chat' : '✉ Email'}
            </button>
          ))}
          <button
            onClick={run}
            disabled={loading || !ticket.trim() || !notes.trim()}
            style={{
              padding: '8px 20px',
              background:
                !ticket.trim() || !notes.trim()
                  ? colors.surfaceLight
                  : colors.accent,
              color:
                !ticket.trim() || !notes.trim() ? colors.textDim : colors.bg,
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              cursor:
                !ticket.trim() || !notes.trim() ? 'not-allowed' : 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              marginLeft: 'auto',
            }}
          >
            {loading ? 'DRAFTING...' : '▶ DRAFT RESPONSE'}
          </button>
        </div>
      </Card>

      {loading && (
        <Card>
          <LoadingDots />
        </Card>
      )}
      {result && (
        <Card title={`Drafted Response (${channel})`}>
          <pre
            style={{
              color: colors.text,
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              fontFamily: 'Georgia, serif',
            }}
          >
            {result}
          </pre>
        </Card>
      )}
    </div>
  );
}

// ─── SENTIMENT PANEL ───
function SentimentPanel() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setRaw('');
    const resp = await callClaude(SYSTEM_PROMPTS.sentiment, input);
    setRaw(resp);
    setResult(tryParseJSON(resp));
    setLoading(false);
  }

  const scoreColor = (s) =>
    s <= 3
      ? colors.red
      : s <= 5
      ? colors.orange
      : s <= 7
      ? colors.blue
      : colors.accent;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card title="Analyze Message Sentiment">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a user message to analyze sentiment..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '12px',
            background: colors.surfaceLight,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            color: colors.text,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={run}
            disabled={loading}
            style={{
              padding: '8px 20px',
              background: colors.accent,
              color: colors.bg,
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
            }}
          >
            {loading ? 'ANALYZING...' : '▶ ANALYZE SENTIMENT'}
          </button>
          {SAMPLE_TICKETS.slice(2, 5).map((t, i) => (
            <button
              key={i}
              onClick={() => setInput(t)}
              style={{
                padding: '4px 10px',
                background: colors.surfaceLight,
                color: colors.textDim,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Sample {i + 1}
            </button>
          ))}
        </div>
      </Card>
      {loading && (
        <Card>
          <LoadingDots />
        </Card>
      )}
      {result && (
        <Card title="Sentiment Analysis">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${scoreColor(result.sentiment_score)}22`,
                border: `3px solid ${scoreColor(result.sentiment_score)}`,
                fontSize: '28px',
                fontWeight: 900,
                color: scoreColor(result.sentiment_score),
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {result.sentiment_score}
            </div>
            <div>
              <StatusBadge
                text={result.sentiment_label}
                color={
                  sentimentColors[result.sentiment_label] || colors.textMuted
                }
              />
              <div style={{ marginTop: '6px' }}>
                <StatusBadge
                  text={`Risk: ${result.risk_level}`}
                  color={
                    result.risk_level === 'Critical'
                      ? colors.red
                      : result.risk_level === 'High'
                      ? colors.orange
                      : colors.accent
                  }
                />
              </div>
            </div>
          </div>
          {result.escalation_needed && (
            <div
              style={{
                padding: '12px',
                background: `${colors.red}15`,
                border: `1px solid ${colors.red}44`,
                borderRadius: '6px',
                marginBottom: '12px',
              }}
            >
              <span
                style={{ color: colors.red, fontSize: '12px', fontWeight: 700 }}
              >
                ⚠ ESCALATION: {result.escalation_type?.toUpperCase()}
              </span>
            </div>
          )}
          {result.escalation_triggers?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: colors.textDim, fontSize: '11px' }}>
                TRIGGER PHRASES
              </span>
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginTop: '6px',
                }}
              >
                {result.escalation_triggers.map((t, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '3px 8px',
                      background: `${colors.orange}22`,
                      color: colors.orange,
                      borderRadius: '3px',
                      fontSize: '11px',
                    }}
                  >
                    "{t}"
                  </span>
                ))}
              </div>
            </div>
          )}
          <div
            style={{
              padding: '12px',
              background: colors.surfaceLight,
              borderRadius: '6px',
              marginTop: '8px',
            }}
          >
            <span style={{ color: colors.textDim, fontSize: '11px' }}>
              RECOMMENDED ACTION
            </span>
            <p
              style={{
                color: colors.text,
                margin: '6px 0 0',
                fontSize: '13px',
              }}
            >
              {result.recommended_action}
            </p>
          </div>
          <div
            style={{
              padding: '12px',
              background: colors.surfaceLight,
              borderRadius: '6px',
              marginTop: '8px',
            }}
          >
            <span style={{ color: colors.textDim, fontSize: '11px' }}>
              TONE ADVICE
            </span>
            <p
              style={{
                color: colors.text,
                margin: '6px 0 0',
                fontSize: '13px',
              }}
            >
              {result.tone_advice}
            </p>
          </div>
        </Card>
      )}
      {!result && raw && (
        <Card title="Raw">
          <pre
            style={{
              color: colors.textMuted,
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {raw}
          </pre>
        </Card>
      )}
    </div>
  );
}

// ─── KNOWLEDGE BASE PANEL ───
function KnowledgePanel() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const samples = [
    "What is Swing's cancellation policy?",
    'How long does a background check take?',
    'How does payment work?',
    'What is a Swing Hero?',
    'How do school admins build a favorites list?',
  ];

  async function run() {
    if (!query.trim()) return;
    setLoading(true);
    setResult('');
    const resp = await callClaude(SYSTEM_PROMPTS.knowledge, query);
    setResult(resp);
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card title="Ask the Knowledge Base">
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder="Ask a question about Swing policies..."
            style={{
              flex: 1,
              padding: '10px 14px',
              background: colors.surfaceLight,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              color: colors.text,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
            }}
          />
          <button
            onClick={run}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: colors.accent,
              color: colors.bg,
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
            }}
          >
            {loading ? '...' : '▶'}
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginTop: '10px',
            flexWrap: 'wrap',
          }}
        >
          {samples.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(s);
              }}
              style={{
                padding: '4px 10px',
                background: colors.surfaceLight,
                color: colors.textDim,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {s.substring(0, 35)}...
            </button>
          ))}
        </div>
      </Card>
      {loading && (
        <Card>
          <LoadingDots />
        </Card>
      )}
      {result && (
        <Card title="Answer">
          <pre
            style={{
              color: colors.text,
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              fontFamily: 'Georgia, serif',
            }}
          >
            {result}
          </pre>
        </Card>
      )}
    </div>
  );
}

// ─── REPORT PANEL ───
function ReportPanel() {
  const [metrics, setMetrics] = useState(SAMPLE_METRICS);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setResult('');
    const resp = await callClaude(
      SYSTEM_PROMPTS.report,
      `Generate a weekly support report narrative from these metrics:\n\n${metrics}`
    );
    setResult(resp);
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card title="Weekly Metrics Input">
        <textarea
          value={metrics}
          onChange={(e) => setMetrics(e.target.value)}
          style={{
            width: '100%',
            minHeight: '140px',
            padding: '12px',
            background: colors.surfaceLight,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            color: colors.text,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={run}
          disabled={loading}
          style={{
            marginTop: '12px',
            padding: '8px 20px',
            background: colors.accent,
            color: colors.bg,
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
          }}
        >
          {loading ? 'GENERATING...' : '▶ GENERATE REPORT'}
        </button>
      </Card>
      {loading && (
        <Card>
          <LoadingDots />
        </Card>
      )}
      {result && (
        <Card title="#support-metrics — Weekly Report">
          <pre
            style={{
              color: colors.text,
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
              fontFamily: 'Georgia, serif',
            }}
          >
            {result}
          </pre>
        </Card>
      )}
    </div>
  );
}

// ─── CALL SUMMARY PANEL ───
function SummaryPanel() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);

  const sample = `[Chat session — Feb 12, 2026, 9:14 AM PT]

Maria Garcia (Substitute Teacher): Hi, my name is Maria Garcia. I worked a 3-day long-term assignment at Jefferson Middle School from Feb 3rd to 5th. But when I check my pay, February 4th shows as "not confirmed" and I didn't get paid for that day.

Sarah (Swing Support): Hi Maria — that's stressful, sorry you're dealing with this. Pulling your assignment record now.

Maria: I was definitely there. The front office staff saw me every day.

Sarah: I see it — Feb 3 and 5 show confirmed, but Feb 4 shows "Not Confirmed" by the school. Reaching out to Jefferson's admin office directly to verify your attendance.

[3 minutes later]

Sarah: Just heard back from Jefferson — they confirmed you were there on Feb 4th. I've updated your attendance record. The payment for that day will be in your next pay cycle, hitting your account Feb 21st.

Maria: Oh thank goodness. I was really worried. Thank you so much for fixing that quickly!

Sarah: Of course! I'm also flagging Jefferson for training on confirming attendance more promptly so this doesn't repeat. Anything else I can help with?

Maria: No, that's everything. Thank you!`;

  async function run() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setRaw('');
    const resp = await callClaude(SYSTEM_PROMPTS.summarize, input);
    setRaw(resp);
    setResult(tryParseJSON(resp));
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card title="Chat Transcript / Email Thread / Interaction Notes">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a call transcript or interaction notes..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            background: colors.surfaceLight,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            color: colors.text,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={run}
            disabled={loading}
            style={{
              padding: '8px 20px',
              background: colors.accent,
              color: colors.bg,
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
            }}
          >
            {loading ? 'SUMMARIZING...' : '▶ SUMMARIZE'}
          </button>
          <button
            onClick={() => setInput(sample)}
            style={{
              padding: '6px 12px',
              background: colors.surfaceLight,
              color: colors.textMuted,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Load Sample Interaction{' '}
          </button>
        </div>
      </Card>
      {loading && (
        <Card>
          <LoadingDots />
        </Card>
      )}
      {result && (
        <Card title="Structured Summary">
          {Object.entries(result)
            .filter(([k]) => k !== 'tags')
            .map(([k, v]) => (
              <div key={k} style={{ marginBottom: '12px' }}>
                <span
                  style={{
                    color: colors.textDim,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                  }}
                >
                  {k.replace(/_/g, ' ')}
                </span>
                <p
                  style={{
                    color: colors.text,
                    margin: '4px 0 0',
                    fontSize: '13px',
                  }}
                >
                  {String(v)}
                </p>
              </div>
            ))}
          {result.tags && (
            <div
              style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                marginTop: '8px',
              }}
            >
              {result.tags.map((t, i) => (
                <StatusBadge key={i} text={t} color={colors.purple} />
              ))}
            </div>
          )}
        </Card>
      )}
      {!result && raw && (
        <Card title="Raw">
          <pre
            style={{
              color: colors.textMuted,
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {raw}
          </pre>
        </Card>
      )}
    </div>
  );
}

// ─── MAIN APP ───
export default function App() {
  const [tab, setTab] = useState('triage');

  const tabs = [
    { id: 'triage', label: 'Triage', icon: '🎯' },
    { id: 'response', label: 'Response', icon: '✍️' },
    { id: 'sentiment', label: 'Sentiment', icon: '🔍' },
    { id: 'knowledge', label: 'Knowledge', icon: '📚' },
    { id: 'summary', label: 'Interaction Notes', icon: '📝' },
    { id: 'report', label: 'Report', icon: '📊' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.bg,
        color: colors.text,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
          background: `linear-gradient(180deg, ${colors.surface} 0%, ${colors.bg} 100%)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '4px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: colors.accent,
              boxShadow: `0 0 10px ${colors.accent}`,
            }}
          />
          <span
            style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '1px' }}
          >
            SWING SUPPORT AI AGENTS
          </span>
          <span
            style={{
              marginLeft: 'auto',
              padding: '3px 10px',
              background: `${colors.orange}22`,
              color: colors.orange,
              border: `1px solid ${colors.orange}44`,
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '1px',
            }}
          >
            DEMO MODE
          </span>
        </div>
        <span
          style={{
            fontSize: '12px',
            color: colors.textDim,
            letterSpacing: '0.5px',
          }}
        >
          6 AI-Powered Workflows for EdTech Customer Support — Built by Viswathi
          Madavan
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {tabs.map((t) => (
          <TabButton
            key={t.id}
            label={t.label}
            icon={t.icon}
            active={tab === t.id}
            onClick={() => setTab(t.id)}
          />
        ))}
      </div>

      <div
        style={{ padding: '20px 24px', maxWidth: '900px', margin: '0 auto' }}
      >
        {tab === 'triage' && <TriagePanel />}
        {tab === 'response' && <ResponsePanel />}
        {tab === 'sentiment' && <SentimentPanel />}
        {tab === 'knowledge' && <KnowledgePanel />}
        {tab === 'summary' && <SummaryPanel />}
        {tab === 'report' && <ReportPanel />}
      </div>

      <div
        style={{
          padding: '16px 24px',
          textAlign: 'center',
          borderTop: `1px solid ${colors.border}`,
          marginTop: '40px',
        }}
      >
        <span
          style={{ fontSize: '11px', color: colors.textDim, lineHeight: 1.6 }}
        >
          Demo mode: pre-built realistic responses showcase the architecture,
          prompt engineering, and UX.
          <br />
          In production, every interaction would route through the Anthropic
          API.
        </span>
      </div>
    </div>
  );
}
