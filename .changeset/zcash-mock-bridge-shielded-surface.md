---
"@ledgerhq/live-common": patch
---

implement the Zcash-only bridge methods in the Zcash mock bridge

Activating the private balance under `MOCK=true` threw a TypeError: the mock bridge replaces the extended Zcash bridge but declared none of the methods the export and shielded-receive flows call on it (`getFullViewingKey`, `deriveShieldedAddress`, `getShieldedAddress`). It now answers all three with device-free stand-ins, the derived address being a well-formed unified address so the send flow still classifies it as a private recipient.
