# Pay Request

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Dual-platform flow package for the Pay tab **Request receive-screen** experience for Ledger Wallet:
a shared view-model and receive-screen component (highlighted address, action tiles) consumed by
the platform presentations on desktop and mobile. QR rendering and the shareable card are added
separately (LIVE-36118 / LIVE-36121).

## View-model

`useRequestReceiveViewModel` is pure and platform-agnostic: no Redux, navigation, device I/O, i18n
or domain dependencies. The host resolves the selected account into primitives and injects the
action side effects; the view-model formats display data and wraps each action with tracking.

```tsx
import { useRequestReceiveViewModel } from "@features/flow-pay-request";

const vm = useRequestReceiveViewModel({
  address,
  asset: { name: "Ethereum", ticker: "ETH" },
  network: "Ethereum",
  page: "Pay",
  onShare: shareCard,
  onCopy: copyToClipboard,
  onSave: saveCardImage,
  onVerify: verifyOnDevice,
  onTrackEvent: track,
});

// vm.asset, vm.network, vm.address, vm.addressParts, vm.qrPayload
// vm.onShare(), vm.onCopy(), vm.onSave(), vm.onVerify()  ← argument-less, tracked
```

The host owns the actual work behind each callback (clipboard, share sheet, card-to-image, device
address verification). Navigation and account selection stay in the app.

`addressParts` is `{ start, middle, end }` (8 + middle + 8) so the UI can highlight the edges
without masking the middle.

### Tracking

Each action emits `button_clicked { button, buttonLocation: "request", page }` via the injected
`onTrackEvent`, where `button` is `share` | `copy address` | `save` | `verify`.

## Components

### `RequestReceive`

Receive dialog/screen for the Pay Request flow. It consumes `useRequestReceiveViewModel` and renders
the asset icon, network row, highlighted address and the action tiles. The host injects copy,
icons, the visible actions and the side-effect callbacks; the component stays i18n-, device- and
navigation-agnostic.

> Native is a full screen (LIVE-35188). Branded QR uses `@shared/ui-qr-code`.

```tsx
import { RequestReceive } from "@features/flow-pay-request";

<RequestReceive
  isOpen={isOpen}
  address={address}
  asset={{ name: "USD Coin", ticker: "USDC" }}
  network="Base"
  page="Pay"
  labels={{
    title: "Request USD Coin",
    networkLabel: "Base network",
    actions: { share: "Share", copy: "Copy", copied: "Copied", save: "Save", verify: "Verify" },
  }}
  assetIcon={{ ledgerId: "usd_coin", ticker: "USDC", network: "base" }}
  networkIcon={{ ledgerId: "base", ticker: "ETH" }}
  visibleActions={["save", "copy", "verify"]}
  onShare={shareCard}
  onCopy={copyToClipboard}
  onSave={saveCardImage}
  onVerify={verifyOnDevice}
  onClose={close}
  onTrackEvent={track}
/>;
```

`visibleActions` controls which tiles render, in order. Desktop uses `["save", "copy", "verify"]`;
mobile uses `["share", "copy", "verify"]`. The Copy tile flips to the `copied` label briefly after use.

### `VerifyAddress`

On-device address-verification overlay used by the Pay Request receive screen. It renders two
phases and stays i18n-, analytics- and device-agnostic — the host app injects copy, tracking and
owns the device interaction:

- `intro` — "Verify your address" sheet/dialog with the **Verify address** CTA. Pressing it calls
  `onVerify`, which the app wires to the shared `verifyAddressIntent` device intent (DIE lives in the
  app, never in this package).
- `success` — "Address displayed on the device's Secure Screen" with the numbered **Next steps** and
  a **Got it** CTA (`onGotIt`).

The `executing` device phase (connect / open app / waiting) is rendered by the app's own
`DeviceIntentExecutor` host, not by this package. The host drives the `phase` prop
(`hidden` → `intro` → `success`).

```tsx
import { VerifyAddress } from "@features/flow-pay-request";

<VerifyAddress
  phase={phase}
  labels={labels}
  page="Pay"
  onVerify={startDeviceIntent}
  onGotIt={close}
  onClose={close}
  onTrackEvent={track}
/>;
```

## Platform resolution

Only views carry a platform suffix (`.web` / `.native`). The container, view-model, types and utils
are platform-agnostic and import without a suffix; TypeScript `moduleSuffixes`, the bundlers
(Rspack / Metro) and the jest preset resolve the right side.

Each view also has a test importing it through its full platform filename. Dead-code analysis
(knip) reads only the solution `tsconfig.json`, which declares no `moduleSuffixes`, so a suffixed
file it can reach through no other path would be reported as dead.

## Structure

Every `index.*` is a pure barrel (`export *` only).

```text
pay-request/
├── package.json
└── src/
    ├── index.ts                                # Public API barrel (web/default) → ./exports
    ├── index.native.ts                         # Native public API barrel → ./exports
    ├── exports.ts                              # Shared public surface (VM + component + utils + types)
    ├── types.ts                                # VM params/return + props/labels contracts
    ├── utils/
    │   ├── splitAddress.ts
    │   └── __tests__/
    └── components/
        ├── RequestReceive/
        │   ├── RequestReceive.tsx                 # Container (platform-agnostic)
        │   ├── useRequestReceiveViewModel.ts      # pure VM: display data + tracked handlers
        │   ├── RequestReceiveView.web.tsx         # Dialog (LWD)
        │   ├── RequestReceiveView.native.tsx      # Full screen (LWM)
        │   └── __tests__/
        └── VerifyAddress/
            ├── VerifyAddress.tsx                  # Container; switches phase
            ├── useVerifyAddressViewModel.ts       # Presentation logic + tracking
            ├── VerifyAddressIntroView.web.tsx     # Dialog (LWD)
            ├── VerifyAddressIntroView.native.tsx  # BottomSheet (LWM)
            ├── VerifyAddressSuccessView.web.tsx
            ├── VerifyAddressSuccessView.native.tsx
            └── __tests__/
```
