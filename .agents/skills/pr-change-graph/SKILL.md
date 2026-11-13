---
name: pr-change-graph
description: Adds a dependency graph of a pull request's changes to its description.
---

```bash
node <this skill's folder>/scripts/change-graph.js --pr <PR URL> --base-branch <PR base branch, such as origin/develop> --head <PR head commit>
```

The script reads both commits from git, not the working tree: they need to be in the local repository, the base branch up to date, but nothing checked out.

Put the output in a ` ```mermaid ` block near the top of the description with `gh pr edit`, replacing the previous dependency graph if there is one.
