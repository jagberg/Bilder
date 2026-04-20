---
name: commit-rewrite-check
description: Use whenever the user asks to commit and push, or whenever you are about to run `git push` yourself (autonomously or otherwise). Offers the option to rewrite the session's commits into logical, distinct units before pushing upstream. Trigger on phrases like "commit and push", "push my changes", "ship it", "send it up", or any time a `git push` is imminent.
---

# Commit rewrite checkpoint

Before any `git push` runs — whether the user asked for it or you initiated it yourself — pause and offer the option to restructure the session's commits into logical units.

## Procedure

1. **Inspect state.** Run:
   - `git status` — see uncommitted work
   - `git log @{u}..HEAD --oneline` — see unpushed commits from this session
   - `git diff` and `git diff --staged` if there are uncommitted changes

2. **Ask once per session.** If this question has not already been answered in the current session, ask the user exactly:

   > You have **N unpushed commits** and **M files with uncommitted changes** this session. Rewrite into logical, distinct commits before pushing?
   > - **yes** — I'll propose a plan and execute after you confirm
   > - **no** — commit remaining work as-is and push
   > - **skip the ask next time** — answer applies to the rest of this session

   Remember the answer for the remainder of the session. If the user previously chose "skip the ask next time" with an answer, honor that choice silently.

3. **Branch on the answer:**

   **If "no":** Stage any uncommitted changes, write a single conventional-commit message covering them, commit, then push. Done.

   **If "yes":** Follow the rewrite procedure below.

## Rewrite procedure

1. **Gather the full change set.** Combine unpushed commits with uncommitted changes:
   - `git reset --soft @{u}` to collapse unpushed commits back into the index (only if there are unpushed commits — check first)
   - `git reset` to unstage everything, keeping all changes in the working tree
   - Now `git diff` shows the complete session's worth of changes

2. **Propose a commit plan.** Group the diff by logical concern. Typical groupings:
   - Feature work (one commit per coherent feature or subsystem change)
   - Refactors (separate from features)
   - Bug fixes (separate commit per fix)
   - Tests (can be combined with the feature they test, or separate if substantial)
   - Formatting / lint / whitespace (always its own commit)
   - Dependency bumps (always its own commit)
   - Documentation (separate unless trivially tied to a feature)

   Present the plan to the user as:

   ```
   Proposed commits:
   1. feat(payments): add retry logic to step7 submission
      - pages/step7.vue
      - composables/useRetry.ts
   2. refactor(api): extract validation into shared util
      - utils/validate.ts
      - pages/step7.vue
   3. test(payments): cover retry edge cases
      - tests/step7.spec.ts
   4. chore: bump nuxt to 3.14
      - package.json
      - pnpm-lock.yaml

   Proceed? (yes / edit / cancel)
   ```

3. **Wait for approval.** If "edit", let the user adjust the grouping in conversation. If "cancel", stop and leave the working tree as it was before step 1 (you may need to `git reflog` to recover — warn the user).

4. **Execute the plan.** For each commit in order:
   - `git add <specific files or hunks>` — use `git add -p` style selection if a file spans multiple logical commits
   - `git commit -m "<conventional commit message>"`

5. **Verify and push.**
   - `git log @{u}..HEAD --oneline` — show the final commit sequence
   - Confirm no uncommitted changes remain: `git status`
   - `git push`

## Rules

- **Never push without completing step 2 of the procedure** (the ask), unless the user has already answered for this session.
- **Never force-push** (`git push --force` or `--force-with-lease`) as part of this flow. If the session's commits have already been pushed, the rewrite would require a force-push — in that case, stop and explain the situation to the user rather than proceeding.
- **Never discard uncommitted work.** If something feels ambiguous, ask before running `git reset --hard` or any destructive command.
- **Use conventional commit messages** (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`, `style:`) with an optional scope in parentheses.
- Keep commit messages specific and descriptive — no "update files" or "misc changes".
