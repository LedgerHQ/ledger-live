# @features/flow-receive

> [!CAUTION]
> **Status: UNSTABLE** — New package for the receive flow revamp; the API is still being designed.

Receive flow of Ledger Wallet, shared by Desktop and Mobile: the screen that shows an account's
receive address, and the screen shown while the device displays that address for verification.

The app keeps what is platform- or legacy-bound: picking the account, the Device Intent Executor
glue that verifies the address, clipboard, share sheet and navigation. It passes them in as props,
callbacks and ports.

## Layout

Per the [flow-package skill](../../../.agents/skills/flow-package/SKILL.md):

```text
src/
├── screens/
│   ├── ReceiveAddress/     # the address screen: a dialog on desktop, a screen on mobile
│   ├── AddressDisplayed/   # "Address securely displayed", while the address is on the device
│   ├── AddressVerified/    # "Address verified", once the device confirmed the same address
│   ├── AddressMismatch/    # "This address doesn't match your Ledger"
│   └── VerifyAddressError/ # the device cannot show the address
├── analytics/              # the newReceiveFlow flag as analytics attributes
├── copy/                   # i18n keys to labels, under the receiveAddress namespace
├── hooks/                  # device verification flow, executor view model and tracking
├── logic/                  # no React: screen state, notices, address split, verification
├── state/                  # verify hint, desktop dialog target, DevTools simulation slices
├── types.ts                # public contract
├── urls.ts                 # support articles the flow links to
├── index.ts                # web barrel
└── index.native.ts         # native barrel
```

Each screen follows MVVM: `useXViewModel.ts` plus `XView.web.tsx` and `XView.native.tsx`.

## Public API

- `ReceiveAddress`: the address screen, opened with `{ accountUUID, assetId }` and reading
  everything from the account model (`receive`, `accountStatus`, `assetStatus`), never a legacy
  `Account`. The app gives what only it has, each optional: without one, its feature is hidden.

  | Prop                     | What the app gives                                             |
  | ------------------------ | -------------------------------------------------------------- |
  | `onCopyAddress`          | the clipboard                                                  |
  | `onShareAddress`         | the system share sheet (mobile)                                |
  | `VerifyAddressExecutor`  | its device verification executor                               |
  | `getFamilyConfig`        | the account's coin family slot, with the flags and legacy account it needs |
  | `serviceIncidents`       | status.ledger.com incidents on the network (`toReceiveServiceIncidents`) |
  | `checkAddressSanctioned` | the sanctions list check; a listed address is never shown      |
  | `onUseLegacyFlow`        | the hand-over to the legacy flow, for an account to onboard or a token to activate |
  | `onOpenUrl`              | opening a support link                                         |
  | `source`                 | the entry point, sent with every event of the screen           |

- `AddressDisplayed`, `AddressVerified`, `AddressMismatch`, `VerifyAddressError`: the screens of
  the device verification, which the apps' executors render per job state.
- `getNewReceiveFlowAttributes(flag)`: the `newReceive` analytics attributes both apps send.
- `@features/flow-receive`: the main entry, resolved per platform through the `react-native`
  condition. It holds the receive family contract: each app's coin family implements
  `GetReceiveFamilyConfig` only where it differs from the defaults (notices, support, device models
  that cannot verify), and `resolveReceiveFamilyConfig` merges it and applies the
  `newReceiveFlow` excluded families.
- `toReceiveTarget(accounts, legacyAccountId, assetId)`: the `ReceiveTarget` (`accountUUID`,
  `descriptor`, `assetId`) behind the legacy id of a main account, from the `accounts` slice state,
  for the entry points that still hold a legacy account. The caller gives the asset to receive.
- `@features/flow-receive/types.mock`: `mockReceiveFamilyConfigInput`, for the families' tests.
- Device verification, around the apps' verify-address intent glue:
  - `canVerifyOnDevice(verification)`: whether **Verify** can be offered, only for an `address`
    verification (the device shows that address for the user to compare).
  - `useVerifyAddressFlow({ onCloseFlow })`: `start(selection)` mounts the verification (ignored
    while one runs); `onExit(outcome)` unmounts it, and closes the receive flow on `mismatch`.
  - `useVerifyAddressExecutorViewModel(params, ports)`: what the app's `DeviceIntentExecutor`
    takes, `null` until it can mount. It exits early with `unsupported` or `failed`, and reads
    `ports` once, so an app can build them on each render.
  - `VerifyAddressExecutorPorts`: what only legacy code has: the account and token reads,
    `getAddressOptions`, `getAddress`, the executor's initialization input and the intent screens.

| Ending                                                    | Outcome       | Event                              | Then                |
| --------------------------------------------------------- | ------------- | ---------------------------------- | ------------------- |
| Result `verified`, **Done**                               | `verified`    | `receive_verification_complete`    | address screen      |
| Result `refused` (no later result)                        | `cancelled`   | `receive_verification_cancelled`   | address screen      |
| Result `mismatch`, **Close**                              | `mismatch`    | `receive_verification_mismatch`    | receive flow closes |
| Result `unsupported`, or unsupported before the device    | `unsupported` | `receive_verification_unsupported` | address screen      |
| Job error, or a failing executor error screen closed      | `failed`      | none                               | address screen      |
| Preparation failed (account, token, init input)           | `failed`      | none                               | address screen      |
| Left before any result, or on an error screen they can fix | `dismissed`  | `receive_verification_dismiss`     | address screen      |

Each result's event is sent when the job reports it: every refusal sends
`receive_verification_cancelled`. A terminal result (`verified`, `mismatch`, `unsupported`) wins
over a later error screen. Each attempt (first run, retry after a refusal, retry from the executor
error screen) forgets the previous refusal and job error.

The executor stays locked, with its header hidden, while the address is requested and shown on
the device (`verifying`, `addressDisplayed`): nothing is checked until the user confirms there.

The apps build the initialization input with `skipWrongDeviceCheck: true`: the executor's account
check is meant to fail fast in signing flows, and the verification must not depend on it. A Ledger
set up with another seed, the usual cause, therefore reaches the job and reports `mismatch`, as a
bug on our side would: the user is warned off the address, told to connect the right Ledger or
contact Ledger Support, and the receive flow closes.

- `@features/flow-receive/state`, slices the apps register:
  - `receiveVerifyHint`: whether the user has already seen the hint pointing at **Verify**. The
    apps persist `receiveVerifyHintPersistedSelector` under their own `receiveVerifyHint` storage
    key, restored with `restoreReceiveVerifyHint`.
  - `receiveAddressDialog` (desktop): the account and asset the address dialog shows.
  - `receiveSimulation`: what the DevTools make the screen show, such as a sanctioned address.
    Not persisted.

## Family-specific content

`ReceiveNoticeId` (`utxo`, `taproot`, `dashStaking`, `tronInactiveAccount`, `tezosDelegation`,
`zcashPrivateNotEnabled`) and the Zcash address options (`transparent`, `shielded`) are named
here, in the generic flow. It is a trade-off: their wording, tone and support links stay in one
place and one catalog namespace, and a family only says which notice it needs. The cost: a family
with a new notice adds its id, wording and tone here. The flow still never branches on a family
name; the families pick their notices in their `GetReceiveFamilyConfig`.

The barrels hold `export *` lines only, per the
[package-public-api skill](../../../.agents/skills/package-public-api/SKILL.md).
