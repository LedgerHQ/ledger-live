---
"@ledgerhq/icons-ui": patch
"@ledgerhq/native-ui": patch
"@ledgerhq/live-common": patch
---

Drop the `camelcase` dependency: icons build scripts use a local `pascalCase` helper, and live-common and native-ui never used it
