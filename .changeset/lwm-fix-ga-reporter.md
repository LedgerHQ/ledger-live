---
"live-mobile": minor
---

Restore GitHub Actions file-bound annotations on `Mobile Code Check` Jest failures by routing the `github-actions` reporter through `fs.writeSync(2, …)` so its workflow commands bypass `jest-quiet-reporter`'s stdio wrap (which silently dropped every chunk written to `process.stderr`). Failing tests now appear as inline annotations in the PR Files tab and the job Annotations panel.
