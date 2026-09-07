---
"ledger-live-desktop": patch
---

Keep the mock server session token reactive in the top bar indicator.

`useMockServerStatus` read the token from a module getter at render time, and only `connected` lived in state. When the `/health` check kept failing nothing re-rendered, so a token published by `bootstrapMockServerTransport` after the first render never reached the indicator and the copy action had nothing to copy. The token is state now, re-read on every poll.
