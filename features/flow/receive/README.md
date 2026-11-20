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
│   ├── AddressDisplayed/   # "Address securely displayed" and Got it, once the address is on the device
│   └── AddressMismatch/    # "This address doesn't match your Ledger", when the device returns another
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
  `descriptor`, `assetId`) behind the legacy id of a main account, from the `accounts` slice state,
  for the entry points that still hold a legacy account. The caller gives the asset to receive.
- `@features/flow-receive/types.mock`: `mockReceiveFamilyConfigInput`, for the families' tests.
- Device verification, around the apps' verify-address intent glue:
  - `canVerifyOnDevice(verification)`: whether **Verify** can be offered, only for an `address`
    verification (the device shows that address for the user to compare).
  - `useVerifyAddressFlow()`: `start(selection)` mounts the verification (ignored while one runs);
    `onExit(outcome)` unmounts it, back to the address screen.
  - `useVerifyAddressExecutorViewModel(params, ports)`: what the app's `DeviceIntentExecutor`
    takes, `null` until it can mount. It exits early with `unsupported` or `failed`, and reads
    `ports` once, so an app can build them on each render.
  - `VerifyAddressExecutorPorts`: what only legacy code has: the account and token reads,
    `getAddressOptions`, `getAddress`, the executor's initialization input and the intent screens.

The verification only asks the device to show the address. Once it is there, "Address securely
displayed" asks the user to compare it with the address once pasted or shared, and **Got it**
(or closing) goes back to the address screen to copy it. If the user approves on the device first
and it returns another address, `AddressMismatch` warns them off it instead.

| Ending                                                   | Outcome       | Event                              |
| -------------------------------------------------------- | ------------- | ---------------------------------- |
| Address shown on the device, then **Got it** or closed   | `displayed`   | `button_clicked` `Got it` on Got it |
| Device returned another address, mismatch screen closed  | `mismatch`    | the screen's `button_clicked`      |
| Unsupported, before or by the device                     | `unsupported` | `receive_verification_unsupported` |
| Job error, or a failing executor error screen closed     | `failed`      | none                               |
| Preparation failed (account, token, init input)          | `failed`      | none                               |
| Left before the address was shown, or on a fixable error | `dismissed`   | `receive_verification_dismiss`     |

Every ending goes back to the address screen. Approved and refused on the device are neither shown
nor tracked, and no answer event is sent: the user usually goes back before answering on the device.
A terminal result wins over a later error screen. Each attempt forgets the previous refusal, job
error and shown address.

The executor stays locked while the address is requested (`verifying`), then lets the user leave.

Before the device shows anything, the executor's wrong device check derives the address the
screen shows, at its path (`toReceiveVerifyAccount` builds the account it checks): a Ledger set up
with another seed, or an address the app computed wrong, stops on the executor's wrong device
screen instead of reaching the user.

- `@features/flow-receive/state`: the `receiveVerifyHint` slice, whether the user has already
  seen the hint pointing at **Verify**. The apps register its reducer under `receiveVerifyHint`
  and persist `hasSeenReceiveVerifyHint` in the `payCard` storage blob, restored with
  `restoreReceiveVerifyHint`.

The barrels hold `export *` lines only, per the
[package-public-api skill](../../../.agents/skills/package-public-api/SKILL.md).
