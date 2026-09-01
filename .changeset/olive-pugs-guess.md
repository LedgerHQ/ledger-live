---
"@ledgerhq/coin-internet_computer": minor
---

Fix four ways an Internet Computer account's operation history misreported itself. Governance calls — following, dissolve delay, hot keys, split, spawn, refresh — were typed `FEES` and filed as a fee that was never charged, with an explorer link that always 404s; they no longer enter history at all. A settled stake was relabelled a plain send until a device-signed `list_neurons` arrived, making the row flicker Staked, Sent, Staked; it is now recognized from its own memo. Retyping a transfer rewrites its operation id, so the sync merge kept the stale copy beside the new one; superseded copies are dropped, including on accounts that already hold them. And the stored operation count re-added the newest page on every sync, so it climbed without bound instead of tracking the account.
