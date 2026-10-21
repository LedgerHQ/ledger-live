---
"@ledgerhq/coin-internet_computer": major
---

Replace the deprecated @dfinity/* packages with @icp-sdk/core and derive account identifiers locally; signed payloads are unchanged.

Breaking: binary values use `Uint8Array` instead of `ArrayBuffer`: `UnsignedTransaction.arg`, the result of `pubkeyToDer`, the replies of `readReplyFromCanister`, and the input of `decodeManageNeuronReply` and `decodeListNeuronsReply`. `Principal` and the agent types come from `@icp-sdk/core`.
