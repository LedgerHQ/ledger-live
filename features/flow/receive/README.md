# @features/flow-receive

> [!CAUTION]
> **Status: UNSTABLE** — New package for the receive flow revamp; the API is still being designed.

Receive flow of Ledger Wallet, shared by Desktop and Mobile: the screen that shows an account's
receive address, and the screen shown while the device displays that address for verification.

The app keeps what is platform- or legacy-bound: picking the account, the device intent that
verifies the address, clipboard, share sheet and navigation. It passes them in as props and
callbacks.

## Layout

The verify hint state and `screens/AddressDisplayed/` are in place; the other screens land in
follow-up tickets. Target layout, per the
[flow-package skill](../../../.agents/skills/flow-package/SKILL.md):

```text
src/
├── screens/
│   ├── Address/            # receive address screen
│   └── AddressDisplayed/   # "Address securely displayed", while the address is on the device
├── copy/                   # i18n keys to labels, under the receiveAddress namespace
├── logic/                  # pure functions, no React
├── state/                  # verify hint slice, registered and persisted by the apps
├── types.ts                # public contract
├── index.ts                # web barrel
└── index.native.ts         # native barrel
```

Each screen follows MVVM: `useXViewModel.ts` plus `XView.web.tsx` and `XView.native.tsx`.

## Public API

- `@features/flow-receive`: the main entry, resolved per platform through the `react-native`
  condition.
- `@features/flow-receive/state`: the `receiveVerifyHint` slice, whether the user has already
  seen the hint pointing at **Verify**. The apps register its reducer under `receiveVerifyHint`
  and persist `hasSeenReceiveVerifyHint` in the `payCard` storage blob, restored with
  `restoreReceiveVerifyHint`.

The barrels hold `export *` lines only, per the
[package-public-api skill](../../../.agents/skills/package-public-api/SKILL.md).
