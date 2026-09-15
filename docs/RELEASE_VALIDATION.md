# Release validation: 0.3.0

Recorded on 2026-09-15. Local validation and all 47 regression cases passed on Windows Node 22.16.0; both Claude package contracts passed. This extends the 0.2.1 compatibility checks below.

- Tracker regressions cover invalid priorities and report windows, protected IDs
  and timestamps, multiline metadata and migration of legacy plain/quoted text.
- Upgrade regressions exercise both adapters, receipts, local conflicts, intentional deletions, unknown
  baselines, dry-run behavior and LF/CRLF changes. Bash and PowerShell wrappers
  accept the upgrade option.
- The [runnable example](../examples/label-normalizer/README.md) records a feature
  implemented by a Codex desktop agent using the kit's instructions inline:
  three behavioral failures against the starter, then four passing tests and
  successful syntax verification without modifying the tests.
- CI runs both adapter replays on Windows/Ubuntu and Node 22/24. The replay contains
  the solution and invokes no model. It does not claim fresh Claude client behavior
  or an autonomous Codex client run.
- The `required-checks` CI job succeeds only when the entire validation matrix and
  Claude plugin contract job succeed. This is the status check used for main's
  branch protection.

The tracker now writes a `# sdlc-tracker-format: json-strings-v1` comment inside
frontmatter and JSON-quotes string values. Existing unmarked metadata retains its
literal values; saving an old item migrates that item. Tools should use `list --json`
instead of parsing the human-readable `show` output. Concurrent tracker writers
are not coordinated; use one writer per project.

## Historical release validation: 0.2.1


Recorded on 2026-09-14. These are compatibility checks and local reproductions, not evidence that every workflow succeeds on every client.

| Check | Evidence |
| --- | --- |
| Source and generated adapters | `node scripts/validate-kit.mjs` and `node scripts/build.mjs --check` pass; 116 generated files |
| Behavioral regressions | `node --test scripts/test-kit.mjs`: 37 cases covering frontmatter, all installer entry points, tracker project roots, staged-content scanning and hook payloads |
| Independent YAML parser | PyYAML 6.0.2 parsed all 115 source/generated headers without errors; used only as an external review tool |
| Claude Code 2.1.270 | `claude plugin validate` passed for both adapter packages and the repository marketplace |
| Codex CLI 0.153.4 | A fresh app-server process discovered all 31 vendored skills through `skills/list`, with no errors, and read both repository plugin packages through `plugin/read` |
| Codex package schema | Both packages passed the local plugin schema validator, including the default prompt field |
| Windows | Node 22.16.0, PowerShell and Git Bash 5.2.37; temporary project paths contain spaces |
| Continuous integration | Workflow exercises Node 22 and 24 on Windows and Ubuntu, plus the pinned Claude plugin contract check |

The regression suite uses fabricated tokens and submits dangerous commands only as inert hook input. It also enables the installed git hook in a disposable repository and checks that Git refuses a commit containing a fabricated token.

The Codex discovery check did not alter the user's plugin installation. Claude checks validated package contracts; no full model-driven Claude session was executed. Jira has not been tested against a live instance. Native Codex hooks and custom agent configurations are not installed by this version.

Current client guidance: [Codex local skills](https://learn.chatgpt.com/docs/build-skills), [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [Codex hooks](https://learn.chatgpt.com/docs/hooks), and [Claude plugin validation](https://code.claude.com/docs/en/plugins-reference).
