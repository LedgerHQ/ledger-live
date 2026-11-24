---
"@features/platform-account-discovery": minor
"@devtools/bindings": patch
"@ledgerhq/live-common": patch
---

Move account discovery behind the `@features/platform-account-discovery/descriptor` entry, which lint restricts to the edges; the root keeps only the errors
