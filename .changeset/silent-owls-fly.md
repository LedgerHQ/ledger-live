---
"@devtools/transport": patch
"@devtools/protocols": minor
---

Envelope construction extracted into `createEnvelope` / `encodeMessage` helpers in `@devtools/transport`. Protocols package migrated to a folder-based layout (`src/<protocol>/index.ts`) with a wildcard export map — new protocols are picked up without touching `package.json`. Full test suite added for copy-store.
