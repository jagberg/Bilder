# Project conventions for Claude Code

## Git workflow

**Before running `git push` — always, without exception — consult the `commit-rewrite-check` skill.** This applies whether the push was user-requested or self-initiated during an autonomous run. The skill handles the "rewrite session commits into logical units?" decision.

Do not bypass this check even when running with `--dangerously-skip-permissions`. The skill's question is a conversational checkpoint, not a permission prompt, and it must still be honored.

### Commit message style

Use conventional commits: `type(scope): description`

Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`, `perf`, `build`, `ci`

Scope is optional but encouraged for any codebase with clear subsystems. Description is lowercase, imperative mood, no trailing period.

### Never

- Never force-push without an explicit, current-turn request from the user. "Yes to rewriting history" earlier in the session is not consent to force-push.
- Never commit secrets, `.env` files, or anything matching `.gitignore` patterns. If `git status` shows something suspicious, stop and ask.
- Never push to `main` / `master` directly if the repo has any protected-branch conventions or PR workflow — open a branch and push there.
