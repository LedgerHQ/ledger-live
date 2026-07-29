---
"@ledgerhq/coin-tezos": minor
---

Add `getAccountInfo` to the Tezos coin module API, exposing the account's on-chain reveal state (`{ type: "tezos", revealed: boolean }`). The reveal state was previously only computed internally inside `craftTransaction`/`estimateFees`; it is now a first-class API method.
