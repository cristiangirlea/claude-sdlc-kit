# Reviewer checklist (condensed)

Run top to bottom against the diff. Anything ticked "no" needs a finding or an explicit acceptance.

## Correctness
- [ ] Boundaries: empty, one, many, max, exact multiples
- [ ] Null / nil / zero-value / missing-key paths
- [ ] Money is not floating point; units and time zones explicit
- [ ] Copy-pasted blocks use the right variables

## Failure handling
- [ ] No swallowed errors; nothing caught broadly and ignored
- [ ] Fallbacks are deliberate and visible, not masking faults
- [ ] Retries distinguish transient from permanent
- [ ] Errors reaching users are actionable and leak nothing

## Security
- [ ] Every new path checks authn and authz
- [ ] Ownership from the session, never from a client-supplied id alone
- [ ] No string-built queries, shell calls, paths or URLs from user input
- [ ] No secrets in code, logs, errors or fixtures
- [ ] No PII added to logs or telemetry

## Concurrency and state
- [ ] Read-modify-write is atomic or locked
- [ ] Handlers are idempotent where delivery can repeat
- [ ] No new shared mutable state across requests

## Data
- [ ] Migration is reversible, or the irreversibility is an explicit decision
- [ ] Expand/contract used; code and schema can deploy independently
- [ ] New query patterns have supporting indexes
- [ ] Backfill is chunked and cancellable

## Contracts
- [ ] No field removed/renamed without a deprecation path
- [ ] Defaults and error codes unchanged, or versioned
- [ ] Clients we do not control keep working

## Tests
- [ ] Each new behaviour has a test that fails without the change
- [ ] Error paths covered
- [ ] No assertion weakened in this diff
- [ ] Deterministic: clock, randomness, ordering, parallelism

## Operability
- [ ] New failure modes are observable (log with context / metric / alert)
- [ ] No unbounded logging in hot paths
- [ ] Config and flags documented

## Fit
- [ ] Matches the conventions of the module it lives in
- [ ] No dead code, no orphan TODO, no commented-out blocks
- [ ] Docs updated where the change invalidated them
