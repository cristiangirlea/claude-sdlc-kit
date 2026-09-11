# Threat prompts

Questions to ask against a diff. Each is designed to surface a specific class of defect fast.

## Identity and access
- Which new paths exist, and what happens if I call each one with no session?
- With a valid session for a different user?
- With a valid session but the wrong role or tenant?
- Where does the code learn who the caller is - session, or a field the caller sent?
- Can I discover whether a resource exists by comparing 403 and 404?

## Input
- List every field that reaches this code from outside. For each: what validates it, and what is the largest/strangest value that still passes?
- What happens with 10 MB of input? 100k array elements? Nested JSON 200 levels deep?
- Any regex applied to user input - can it backtrack catastrophically?
- Any user string that becomes part of a query, path, command, URL, template or log line?

## Data exposure
- What exactly is in the response body - is any field there only because the ORM included it?
- What is written to logs on the error path? On the success path?
- Does an error message differ in a way that reveals internal state?
- Is any PII newly persisted, and is there a retention story?

## Outbound
- Does this fetch a URL the user influenced? What stops it reaching 169.254.169.254 or 10.0.0.0/8?
- Are redirects followed, and re-validated?
- Is there a timeout, a size cap, and a retry cap?

## State and concurrency
- What happens if this request arrives twice - retry, double-click, at-least-once queue?
- What happens if two of them run at the same moment on the same row?
- Is anything cached that encodes an authorization decision?

## Failure
- If the dependency is down, does this fail closed or open?
- Is any error swallowed such that a security check silently did not run?

## Supply chain
- New dependency: who publishes it, how recently, how many maintainers, is the name a near-miss for a popular package?
- Is the version pinned in a lockfile?

## LLM paths
- Does untrusted text reach a prompt? Does model output reach a sink with authority?
- Could content in a fetched page or a document instruct the model into an action the user did not ask for?
