---
"@ledgerhq/live-cli": patch
"@ledgerhq/live-common": patch
"live-mobile": patch
---

fix: replace exec/execSync with execFile/execFileSync to avoid shell injection

- live-mobile: v3check and v3clean use execFile for git (shared v3-common.js); executeAsync rejects only on non-zero exit; v3clean uses fs.promises.rm and awaits deletions
- @ledgerhq/live-cli: cleanSpeculos uses execFileSync for docker commands
- @ledgerhq/live-common: bot portfolio process-main uses spawn and fs APIs instead of exec
