---
"@ledgerhq/live-countervalues": minor
"@ledgerhq/live-countervalues-react": minor
---

Mark `live-countervalues` and `live-countervalues-react` as private, source-only packages. Both packages flip together: privatising the core alone would leave a published package with a private runtime dependency.
