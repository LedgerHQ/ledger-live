---
"@ledgerhq/hw-transport-mocker": patch
"@ledgerhq/live-common": patch
---

fix: ignore web socket messages coming from the HSM once a bulk message has been received

- Added unit/snapshot case test on receiving a message after a bulk message
- Enabled a blocker on exchange method on mocked TransportReplayer
