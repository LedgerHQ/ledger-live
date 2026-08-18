# Pay Card Request

> [!CAUTION]
> **Status: UNSTABLE** — Scaffold only; public API is still being designed.

Dual-platform flow package that will host the Pay tab **Request receive-screen** experience for
Ledger Wallet: a shared view-model and receive-screen component (QR, truncated address, action
slot, shareable card) consumed by the platform presentations on desktop and mobile.

## Scope

The receive-screen view-model and component land in
[LIVE-35187](https://ledgerhq.atlassian.net/browse/LIVE-35187) and its platform tickets
(LIVE-35188 / LIVE-35189). The first shipped surface is the **VerifyAddress** overlay.

## Components

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
import { VerifyAddress } from "@features/flow-pay-card-request";

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

Only views carry a platform suffix (`.web` / `.native`). The container, view-model, and types stay
platform-agnostic and import without a suffix; TypeScript `moduleSuffixes`, the bundlers
(Rspack / Metro) and the jest preset resolve the right side.

## Structure

Every `index.*` is a pure barrel (`export *` only).

```text
pay-card-request/
├── package.json
└── src/
    ├── index.ts          # Public API barrel (web/default)
    ├── index.native.ts   # Public API barrel (native)
    ├── exports.ts        # Shared barrel re-exported by both platforms
    ├── types.ts          # Platform-agnostic props/labels contract
    └── components/
        └── VerifyAddress/
            ├── VerifyAddress.tsx                  # Container; switches phase
            ├── useVerifyAddressViewModel.ts       # Presentation logic + tracking
            ├── VerifyAddressIntroView.web.tsx     # Dialog (LWD)
            ├── VerifyAddressIntroView.native.tsx  # BottomSheet (LWM)
            ├── VerifyAddressSuccessView.web.tsx
            ├── VerifyAddressSuccessView.native.tsx
            └── __tests__/
```
