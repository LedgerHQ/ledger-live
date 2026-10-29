---
name: pr-change-graph
description: Adds a dependency graph of a pull request's changes to its description.
---

```bash
git fetch origin <PR branch> <PR base branch>
node <this skill's folder>/scripts/change-graph.js --pr <PR URL> --base-branch origin/<PR base branch> --head origin/<PR branch>
```

Put the output in a ` ```mermaid ` block near the top of the description with `gh pr edit`, replacing the previous dependency graph if there is one.
