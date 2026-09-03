---
"ledger-live-desktop": patch
---

Open the mock server configuration UI by right-clicking the top bar indicator.

The indicator still copies the session token on a left click. A right click now opens the mock server's own configuration UI — served from the server root — on that same session, so the devices Ledger Live sees can be edited without pasting a token by hand.

The token travels in the URL fragment (`#token=…`), which never reaches the server, and the link is opened without an analytics event so the token stays out of the tracking payload.
