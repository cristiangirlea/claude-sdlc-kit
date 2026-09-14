---
name: "incident-response"
description: "How to handle a production incident - stabilise before diagnosing, communicate on a clock, mitigate with the cheapest reversible action, then run a blameless postmortem that produces tracked actions. Use when something is broken in production, when an alert fires, when a deploy needs rolling back, or when writing the postmortem afterwards."
---

# Incident response

Order of operations, and it is not negotiable: **stop the bleeding, then find the cause.** Diagnosis during an active outage is a luxury paid for by users.

## 0. Declare

Say it out loud: what is broken, for whom, since when. Assign one **incident lead** (coordinates, decides, communicates) - if you are alone, you are the lead and you write things down as you go.

Severity, roughly:

| Sev | Meaning | Response |
| --- | --- | --- |
| 1 | Down, or data at risk, for many users | Everything stops; mitigate now |
| 2 | Major feature broken or badly degraded | Immediate, but no need to wake the company |
| 3 | Limited impact, workaround exists | Same day |

## 1. Stabilise

Prefer the cheapest reversible action, in this order:

1. **Roll back** the last deploy - if the timeline correlates, this is almost always right, and it is reversible.
2. **Turn off the flag** or disable the feature.
3. **Shed load**: rate-limit, disable an expensive path, drain a bad node.
4. **Scale or fail over** if the constraint is capacity or a bad dependency.
5. Only then, a **forward fix** - and only if it is small, understood, and testable.

Do not debug in production while users are broken. Do not ship a speculative fix to see what happens. Two rules that keep an incident from becoming two incidents.

## 2. Communicate

Post at declaration, then at a fixed cadence (15 minutes for Sev 1) even when there is nothing new - silence reads as chaos. Each update: what is affected, what is being done, what is next, when the next update comes. State impact in user terms, not internal terms.

## 3. Preserve evidence before it disappears

Logs roll, dashboards re-window, pods restart. Grab, early: the failing request ids and traces, error rates and latency graphs with timestamps, the deploy/config change timeline, relevant log excerpts, and the exact state of any queue or table you are about to fix by hand.

## 4. Diagnose

Once impact is contained, use the {{AGENT:debugger}}'s method: reproduce, form ranked hypotheses, eliminate with evidence, prove the mechanism. **What changed?** answers most incidents: deploys, config, flags, migrations, dependency updates, traffic shape, expiring certificates and credentials, a full disk, a clock.

## 5. Repair forward

- Write the regression test that fails on the bug, and land it with the fix.
- Reconcile data damage deliberately - script it, dry-run it, keep the before state.
- Re-enable what you disabled, one thing at a time, watching the signal you disabled it for.

## 6. Postmortem, blameless

Within a few days, while memory is fresh. Blameless means the question is "what let this reach production?", never "who did it" - a system that a competent person can break by making a normal mistake is a broken system.

```markdown
# Postmortem: <title> (<date>)
- Severity / duration / user impact (with numbers)
## Timeline (UTC)
- HH:MM - <event, with who observed it and how>
## Root cause
<the mechanism, not the person>
## Contributing factors
<what made it possible, or made it last longer>
## What went well
## What made it worse
## Detection
<how we found out, and how long that took - if a user told us, that is a finding>
## Action items
| Action | Type (prevent/detect/mitigate) | Owner | Tracker id |
```

Rules for action items: each has an owner and a tracker id, or it will not happen. Prefer **prevention** (make the mistake impossible) over **detection** (find it faster) over **process** ("be more careful" is not an action item). Cap the list at what will actually be done - five real items beat twenty aspirational ones.

## Feed it back

The lesson belongs where the next person will meet it: a test, a lint rule, a hook, an alert, a line in `{{MEMORY}}`, or a checklist item in `definition-of-done`. An incident that changes no artefact will recur.
