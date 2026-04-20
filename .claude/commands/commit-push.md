---
description: Review session commits and offer to rewrite into logical units before pushing
---

Invoke the `commit-rewrite-check` skill now, regardless of whether a commit or push was just requested. Walk through its full procedure:

1. Inspect current git state (status, unpushed commits, uncommitted changes)
2. Ask whether to rewrite into logical commits
3. Execute the chosen branch (rewrite or straight commit+push)

Treat this as a fresh checkpoint — do not rely on any earlier "skip the ask" answer from this session.
