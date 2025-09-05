---
"@ledgerhq/hw-transport-webhid": patch
---

Fixes a thrown InvalidStateError DOMException from being thrown when TransportWebHID.open is called on a device with an already open connection.
