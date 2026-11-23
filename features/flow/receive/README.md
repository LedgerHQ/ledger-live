# @features/flow-receive

> [!CAUTION]
> **Status: UNSTABLE** — New package for the receive flow revamp; the API is still being designed.

Receive flow of Ledger Wallet, shared by Desktop and Mobile: the screen that shows an account's
receive address, and the screen shown while the device displays that address for verification.

The app keeps what is platform- or legacy-bound: picking the account, the Device Intent Executor
glue that verifies the address, clipboard, share sheet and navigation. It passes them in as props,
callbacks and ports.

## Layout

The verify hint state, the device verification state and its screens are in place;
the other screens land in follow-up tickets. Target layout, per the
[flow-package skill](../../../.agents/skills/flow-package/SKILL.md):

```text
src/
├── screens/
│   ├── Address/            # receive address screen
│   ├── AddressDisplayed/   # "Address securely displayed", while the address is on the device
│   ├── AddressVerified/    # "Address verified", once the device confirmed the same address
│   └── AddressMismatch/    # "Don't use this address", when the device confirmed another one
├── copy/                   # i18n keys to labels, under the receiveAddress namespace
├── hooks/                  # device verification flow, executor view model and tracking
├── logic/                  # no React: verify guard, device request wiring, executor preparation
├── state/                  # verify hint slice, registered and persisted by the apps
├── types.ts                # public contract
├── index.ts                # web barrel
└── index.native.ts         # native barrel
```

Each screen follows MVVM: `useXViewModel.ts` plus `XView.web.tsx` and `XView.native.tsx`.

## Public API

- `@features/flow-receive`: the main entry, resolved per platform through the `react-native`
  condition. It holds the receive family contract: each app's coin family implements
  `GetReceiveFamilyConfig` only where it differs from the defaults (notices, support, device models
  that cannot verify), and `resolveReceiveFamilyConfig` merges it and applies the
  `newReceiveFlow` excluded families.
- `toReceiveTarget(accounts, legacyAccountId, assetId)`: the `ReceiveTarget` (`accountUUID`,
  `account` with its network and path, never its key, `assetId`) behind the legacy id of a main account, from the `accounts` slice state,
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

- `@features/flow-receive/state`: the `receiveVerifyHint` slice, whether the user has already
  seen the hint pointing at **Verify**. The apps register its reducer under `receiveVerifyHint`
  and persist `hasSeenReceiveVerifyHint` in the `payCard` storage blob, restored with
  `restoreReceiveVerifyHint`.

The barrels hold `export *` lines only, per the
[package-public-api skill](../../../.agents/skills/package-public-api/SKILL.md).
