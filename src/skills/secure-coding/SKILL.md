---
name: "secure-coding"
description: "Defensive security practices to apply while writing code and to check while reviewing it - trust boundaries, authn/authz, input validation, injection sinks, secret handling, SSRF, safe defaults, dependency hygiene and LLM-specific risks. Use when writing or reviewing code that handles user input, authentication, authorization, files, outbound requests, payments or personal data."
---

# Secure coding

Security is decided at the **trust boundary**: the line where data you do not control enters code you do. Everything below is about finding those lines and defending them.

Untrusted sources include: HTTP params, headers, cookies and bodies; uploaded files; webhooks; third-party API responses; rows written by other users; message queues; environment in a multi-tenant host; **and the output of an LLM**.

## Authorization is the one that bites

Most real breaches are not exotic. They are a route that forgot to check who is asking.

- Enforce authorization **on the server, on every path**, including the "internal" one, the batch endpoint, and the new export button.
- Derive identity from the **session or verified token**, never from a client-supplied `userId` field.
- Check **object ownership**, not just role: "is this row's owner the caller?" is a different question from "is the caller logged in".
- Scope every query by tenant at the data layer, so a forgotten filter cannot leak across tenants.
- Fail closed: unknown role, missing claim, or an error while checking means denied.

```
// wrong - trusts the caller's claim
const search = await store.get(req.body.searchId);

// right - the query itself cannot cross the boundary
const search = await store.getOwned(req.body.searchId, session.userId);
if (!search) return notFound();   // not 403: do not confirm existence
```

## Validate at the boundary, encode at the sink

- **Validate** shape, type, range and length as data enters - allowlists, not denylists. Reject rather than sanitise when you can.
- **Encode** for the destination as data leaves: parameterised SQL, HTML escaping, shell argument arrays (never a concatenated command string), URL encoding, JSON serialization.
- Bound everything: request body size, array lengths, page sizes, regex complexity (catastrophic backtracking is a denial-of-service), upload size and type.
- Normalise before comparing (unicode, case, path) - and canonicalise paths before any file access to defeat `../`.

## Injection sinks to grep for

| Sink | Safe form |
| --- | --- |
| SQL / NoSQL | Parameterised queries or a query builder; never string interpolation |
| Shell | Argument arrays with no shell; avoid entirely if possible |
| File paths | Resolve, then assert the result is inside the intended root |
| HTML | Framework escaping; `dangerouslySetInnerHTML` / `v-html` only on sanitised, trusted content |
| Templates | No user input in the template source |
| Outbound URLs | Allowlist of hosts; block private ranges and metadata addresses |
| Deserialization | Data-only formats; never native deserialization of untrusted bytes |
| Log lines | Escape newlines; never log secrets or PII |

## Secrets

- Never in source, fixtures, tests, or example files that hold real values. `.env.example` gets placeholders.
- Never in logs, error messages, or telemetry - including the "helpful" debug dump of a request.
- Read from environment or a secret manager; fail loudly at startup if a required secret is missing.
- If a secret is ever committed, it is compromised: rotate it, then clean history. Removing the file is not enough.
- Use constant-time comparison for tokens and signatures.

## Safe defaults

- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax` or stricter.
- CORS: explicit origin allowlist; never `*` together with credentials.
- Errors to clients: generic message plus a correlation id; the detail goes to the log.
- TLS everywhere, certificate verification never disabled "temporarily".
- Rate-limit authentication, password reset, search, and anything expensive.
- Timeouts and retry caps on every outbound call.
- New features off by default; permissions granted narrowly.

## Server-side request forgery

Any feature that fetches a user-supplied URL is an SSRF until proven otherwise: resolve the host, reject private and link-local ranges and cloud metadata addresses, do not follow redirects blindly (re-check every hop), and prefer an allowlist of hosts. This applies to webhooks, "import from URL", avatar fetching and link previews.

## Dependencies

- Add a dependency only when its absence would cost real work; each one is permanent attack surface.
- Check name carefully (typosquats), publish history, and maintenance status.
- Pin versions with a lockfile; keep an automated update path so patches are routine rather than heroic.
- Run the ecosystem's audit tool in CI, and treat a known-exploitable advisory as a blocker.

## When code touches an LLM

- Treat model output as untrusted input: it can carry injected instructions from anything it read.
- Never pass model output straight into a shell, a query, a file path, or a request to an internal service.
- Keep authority out of the prompt: authorization decisions belong in code, not in an instruction the model is asked to respect.
- Log prompts and completions with the same PII discipline as any other data.

## Review pass

- [ ] Every new route: authenticated, authorized, ownership-checked, tenant-scoped
- [ ] Input validated at the boundary; sizes and lengths bounded
- [ ] No injection sink reachable from user input
- [ ] No secret in code, log, error or fixture
- [ ] Outbound fetches of user URLs are allowlisted
- [ ] Errors leak nothing; failures close rather than open
- [ ] New dependency justified, pinned and audited
