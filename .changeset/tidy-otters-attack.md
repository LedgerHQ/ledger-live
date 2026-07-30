---
"live-mobile": minor
---

Fix countervalue resetting to USD after killing and restarting the app when the selected fiat (e.g. AMD) is not part of the offline fallback list. The boot-time "reset unsupported countervalue" guard ran against the fallback fiats before the CVS supported-fiats query resolved; the reset now lives in the reactive path gated on `fiatsReady`, so it only acts on the authoritative CVS list.
