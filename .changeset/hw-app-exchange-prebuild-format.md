---
"@ledgerhq/hw-app-exchange": patch
---

Format the generated protobuf files in `prebuild`. `pbjs`/`pbts` emit their own style while the committed `generate-protocol.js`/`.d.ts` are oxfmt-formatted, so regenerating them always dirtied the tree and failed the CLI job's `git diff` check. Only visible on an nx cache miss, which is why it went unnoticed.
