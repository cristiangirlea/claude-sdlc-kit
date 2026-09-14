# Security

Report a vulnerability through [GitHub private vulnerability reporting](https://github.com/cristiangirlea/claude-sdlc-kit/security/advisories/new). Include the affected version, minimal reproduction and impact. Use fabricated credentials in reproductions. Do not post real secrets or exploit details in a public issue.

This is an experimental workflow kit. Security fixes target the latest version; there is no support or response-time guarantee.

The guard scripts detect selected patterns. They do not parse every shell language, recognize every credential, or prevent all writes. Claude session guards fail open on internal errors. The git guard scans staged blobs and refuses a commit if scanning fails, but local hooks can be disabled or bypassed with `--no-verify`.

Role instructions such as “read-only” or “test files only” do not enforce filesystem permissions. Configure the coding client's sandbox and approvals, and use server-side policy where enforcement is required. This release does not configure native Codex hooks.

The optional git guard requires both files from `templates/git-hooks/`, Node.js, Git and Bash. Review installed permissions and scripts before enabling them. If a real credential was exposed, rotate it; deleting the current file does not remove earlier copies or Git history.
