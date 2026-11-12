# Receive

> [!CAUTION]
> **Status: UNSTABLE** — Proof of concept for the receive flow revamp ([LIVE-40844](https://ledgerhq.atlassian.net/browse/LIVE-40844)); API will change.

Dual-platform flow package for the receive address screen of Ledger Wallet: QR code, address,
Copy / Share / Verify, family notices, the memo tag card and the help card.

The app keeps everything platform- or legacy-bound: account selection (Modular Asset
Drawer/Dialog), resolving the account into primitives, the device intent (DIE) that verifies the
address, clipboard, share sheet and URLs.

## Layout

```text
src/
├── types.ts                       # public contract, including the family contract
├── logic/resolveReceiveFamilyConfig.ts
├── copy/useReceiveAddressCopy.ts  # i18n keys → labels (receiveAddress.*)
├── utils/                         # address splitting
└── screens/Address/
    ├── ReceiveAddress.tsx         # <ReceiveAddressView {...useReceiveAddressViewModel(props)} />
    ├── useReceiveAddressViewModel.ts
    ├── ReceiveAddressView.web.tsx # Lumen Dialog
    ├── ReceiveAddressView.native.tsx
    └── components/                # summary (QR), action tiles, verify hint, extras
└── screens/AddressDisplayed/         # "Address securely displayed", rendered by the app's DIE
```

## Family contract

The flow never branches on a family name. `useAccountReceive(descriptor, assetId)` reads three
account data kinds: `receive` (the address and its verification), `accountStatus` and the
`assetStatus` of the asset, merged into one `gate` by `receiveGate`. Each app's coin family only
adds what the screen shows on top, a `Partial<ReceiveFamilyTraits>`. The app merges them with
`resolveReceiveFamilyConfig({ family, familyConfig, excludedFamilies, receive, gate })`:

| Field | Source | Meaning |
| --- | --- | --- |
| `isSupported` | Family traits, `excludedFamilies` | `false` keeps the account on the legacy receive flow |
| `notices` | Family traits | Banners: `utxo`, `taproot`, `dashStaking`, `tronInactiveAccount`, `tezosDelegation`, `zcashPrivateNotEnabled` |
| `unsupportedDeviceModelIds` | Family traits | Device models the DIE verification must refuse (Aptos on Nano S) |
| `verification` | `AccountReceive.verification` | `device`, or `unavailable` (Verify disabled with an explanation) |
| `memoType` | `AccountReceive.memo` (each address option carries its own) | `text`, `tag` or `typed`: shows the "Need a Tag/Memo?" card for the address shown |
| `activationKind` | `assetStatus` gate `method` | How the token is activated first: association, opt-in, trustline, authorize |
| `addressOptions` | `AccountReceive.shielded` | Several addresses (Zcash transparent / shielded): a "Select address" step comes first |

`resolveReceiveBlock` turns the reads into `isLoadingAddress` and `blockedReason`:

| Data | `blockedReason` |
| --- | --- |
| `accountGate` `onboarding` | `onboardingRequired` (legacy flow) |
| A needed read failed | `readFailed` (retry, legacy flow) |
| `assetGate` `activation` | `assetActivationRequired` (family flow, else legacy flow), then `assetActivationPending` once that flow is over and `assetStatus` still says so |
| `assetGate` `unknown` | `assetActivationUnknown` (retry, legacy flow) |
| Sanctioned address | `sanctioned` |

Skeletons stand in while a status or the address is read, and while `assetStatus` is read again
after an activation flow. The host also resolves `isCheckingAddress` (sanctions) and
`serviceIncidents` (status.ledger.com).

`excludedFamilies` comes from the `newReceiveFlow` flag params.

## Usage

```tsx
import { ReceiveAddress } from "@features/flow-receive";

<ReceiveAddress
  address={address}
  asset={{ name: "Bitcoin", ticker: "BTC" }}
  network="Bitcoin"
  assetIcon={{ ledgerId: "bitcoin", ticker: "BTC" }}
  family={familyConfig}
  visibleActions={["copy", "verify"]}
  onCopy={copy}
  onVerify={verifyOnDevice}
  onOpenHelpArticle={openArticle}
  onLearnMoreMemoTag={openMemoTagArticle}
  onClose={close}
/>
```

## Verify address

Verify starts the app's device intent right away, with no intro. The DIE shows its standard
device and error screens; as soon as the address reaches the device Secure Screen
(`addressDisplayed` job state), the app's intent component renders `AddressDisplayed`
(copy under `receiveAddress.addressDisplayed.*`) and keeps it after the confirmation.

## Next steps

- Move Pay Request onto this package and delete `@features/flow-pay-request`.
