# Contributing

Report a reproducible bug or propose a focused improvement through GitHub issues. For security issues use [private reporting](SECURITY.md).

Use Node.js 22+, Git and Bash (Git Bash on Windows). The runtime has no npm dependencies. CI uses a pinned Claude CLI for plugin contract checks.

Edit `src/`, `scripts/`, `templates/` or `docs/` as appropriate. Do not edit generated `adapters/` or marketplace manifests by hand. The source manifest controls both plugin packages.

```bash
node scripts/build.mjs
node scripts/validate-kit.mjs
node --test scripts/test-kit.mjs
git diff --check
```

Keep frontmatter in the strictly parsed subset: flat fields with JSON-quoted strings or string arrays. Put agent examples in the body. See [authoring](docs/AUTHORING.md).

Include the failure scenario, the changed behavior, and the checks you ran in a pull request. Exercise installer and tracker changes against a fresh temporary project. Never include credentials or private project content in examples, screenshots or logs. Preserve the MIT notice in redistributed copies.

Jira remains an unverified design; changes must keep its discovery steps and limitations explicit. Report which client/version you actually tested when changing an adapter.

## Pull requests and required checks

Send changes through a pull request to `main`. The `required-checks` status job
requires every Windows/Ubuntu Node 22/24 validation job and the Claude plugin
contract job to pass. Branch protection requires an up-to-date branch and a pull
request, applies to administrators, and disallows force pushes and branch deletion.
No minimum reviewer count is configured for this single-maintainer project.

Include changes in `src/`, regenerate adapters, and include new behavior tests.
For installer changes, verify dry-run and conflict preservation. The full test
suite also replays the runnable example with both adapters.
