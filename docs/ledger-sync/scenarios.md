# Behaviour scenarios

A catalogue of the behaviours Ledger Sync **guarantees**, migrated from the Confluence
"Test scenarios by example". Each was a **screen-recording demo**; videos can't live in the repo,
so they stay **linked** (📹) to their Confluence page — the behaviour and its
[verification](./test-strategy.md) are what matter here.

> [!NOTE]
> - **📹** links the original demo recording on Confluence (legacy; to be refreshed).
> - **Verified by** links a behaviour to a deterministic
>   [LKRP scenario](./test-strategy.md#deterministic-scenario-tests-lkrp)
>   (`libs/ledger-key-ring-protocol/tests/scenarios`) or a
>   [WalletSyncDataManager test](./test-strategy.md#walletsyncdatamanager-unit-tests).
>   App-level behaviours are validated manually / in app E2E (**QA**).

## Trustchain lifecycle

| Behaviour | Demo | Verified by |
|---|---|---|
| Initialize a new Trustchain with the hardware wallet. | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4896948303) | `success`, `getOrCreateTransactionCases` |
| Add a second member via another device initialisation. | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4895998087) | `twoAddMembersFollowedByDeviceAdd`, `membersManySelfAdd`, `member3implicitlyAdded`, `addSameMemberMultipleTimes` |
| Add a member via the [QR-code flow](./03-qr-code-protocol.md) (LWD side). | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4896948315) | QA (app E2E) |
| A member **cannot** be removed with the wrong device seed → [`TrustchainNotAllowed`](./errors.md#trustchainnotallowed). | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4896129082) | `removeMemberWithTheWrongSeed` |
| Removing yourself is forbidden. | — | `removingYourselfIsForbidden` |
| A Trustchain auto-**ejects** when another member destroys it. | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4895998105) | `removedMemberEjectedOnDeletedTrustchain`, `randomMemberTryToDestroy` |
| A Trustchain auto-ejects when **you** are removed (detected on get-members / restore). | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4896424000) | `removedMemberEjectedOnGetMembers`, `removedMemberEjectedOnRestore` |
| A Trustchain auto-**restores** on [key rotation](./02-trustchain-sdk.md#key-rotation-on-member-removal) (another member removed). | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4896358455) | `removingAMemberCreatesAnInteraction` |
| The same `memberCredentials` can exist in different trustchains (user switches seed). | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4906024977) | `create2trustchainInARow` ([LIVE-13572](https://ledgerhq.atlassian.net/browse/LIVE-13572)) |
| JWT is refreshed transparently when it expires. | — | `tokenExpires` |
| Ring init (wallet-cli, appId 17) preserves the Ledger Sync member. | — | `ringInitPreservesLedgerSyncMember` |
| Device-refusal paths are handled gracefully. | — | `userRefusesAuth`, `userRefusesRemoveMember` |

### App-level resilience (QA)

- **Reboot Ledger Wallet** still has the Trustchain you set up (it's persisted) —
  [📹 demo](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4896030757).
- With a **password on LWD**, `app.json` encrypts the `trustchain` and `wallet` fields — after a
  reboot the Trustchain is still accessible —
  [📹 demo](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4897046593)
  (`watch "cat app.json | jq '.data.trustchain'"` to observe).
- The Trustchain does **not** eject if the **network is off** (only an authoritative server
  response can eject) —
  [📹 demo](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4895866931).
- **TODO** — the Trustchain must not eject when the Trustchain / Cloud Sync API is down
  ([LIVE-13576](https://ledgerhq.atlassian.net/browse/LIVE-13576)) —
  [📹 demo](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4906123313).

## Wallet Sync data

| Behaviour | Demo | Verified by |
|---|---|---|
| Adding accounts is propagated to other members. | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4895866941) | `__tests__/modules/accounts.test.ts`, QA |
| Removing an account is propagated to other members. | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4896849973) | `accounts.test.ts`, QA |
| Renaming an account is propagated to other members. | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4896161884) | `__tests__/modules/accountNames.test.ts`, QA |
| Wallet Sync recovers after being removed; history reconciliates. | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4895965222) | QA |
| Wallet Sync works even when Ledger Wallet doesn't support a received account (unsupported currency, sync issues): the account is queued, not lost. | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4896161894) | `accounts.test.ts` (nonImportedAccountInfos) |
| Wallet Sync preserves non-imported accounts and restores them when available (backoff retry). | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4896620635) | `accounts.test.ts`; see [accounts module](./05-wallet-sync-data-manager.md#the-accounts-module) |
| Wallet Sync supports account-**id migration**. | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4896129100) | `accounts.test.ts` |
| Wallet Sync preserves **unknown fields** in Cloud Sync's DistantState (forward compat). | [📹](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4896849983) | `__tests__/compatibility.test.ts` |

> [!TIP]
> Most data scenarios are easiest to reproduce in the
> [web-tools playground](./cookbook.md#test-on-the-web-tools-playground) with several tabs open
> as different members. To simulate an unsupported-currency failure, remove the currency from the
> allowed list in the Environment panel.
