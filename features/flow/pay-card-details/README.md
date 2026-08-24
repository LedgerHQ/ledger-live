# Pay Card Details

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Dual-platform flow package for the Pay tab **card visual** for Ledger Wallet: the physical card
face (dark gradient + halftone artwork + network logo) and, on top of it, the card balance overlay.

Props-only and i18n-agnostic — the host owns data fetching, currency formatting and labels.

## Usage

```tsx
import { CardVisual } from "@features/flow-pay-card-details";

<CardVisual balance={100} formatCountervalue={format} balanceLabel="Balance" />;
```

`CardVisual` composes the `CardArtwork` (card face) with the balance overlay. `CardArtwork` is also
exported on its own for consumers that only need the card face.

## Platform resolution

Only the view carries a platform suffix (`.web` / `.native`). Barrels and platform-agnostic modules
import without a suffix; TypeScript `moduleSuffixes`, the bundlers (Rspack / Metro) and the jest
preset resolve the right side. Each view has a test importing it through its full platform filename.

The desktop artwork renders the halftone SVGs exported from Figma (imported as URLs via the bundler
`asset/resource` rule). Native `CardArtwork` and `CardVisualView` are empty stubs until an LWM
design lands.

## Structure

Every `index.*` is a pure barrel (`export *` only).

```text
pay-card-details/
├── package.json
└── src/
    ├── assets.d.ts                            # `*.svg` module declaration (URL default export)
    ├── components/
    │   ├── CardArtwork/
    │   │   ├── CardArtwork.web.tsx            # Card face + halftone artwork + Visa logo
    │   │   ├── CardArtwork.native.tsx         # Empty stub until LWM design
    │   │   ├── assets/                        # Figma-exported SVGs
    │   │   ├── CardArtwork.web.test.tsx
    │   │   └── CardArtwork.native.test.tsx
    │   └── CardVisual/
    │       ├── CardVisual.tsx                 # Container (props → view)
    │       ├── CardVisualView.web.tsx         # Artwork + balance overlay
    │       ├── CardVisualView.native.tsx      # Empty stub until LWM design
    │       ├── CardVisual.web.test.tsx
    │       ├── CardVisual.native.test.tsx
    │       ├── CardVisualView.web.test.tsx
    │       └── CardVisualView.native.test.tsx
    ├── types.ts                               # Public props / view-model types
    ├── exports.ts                             # Public surface
    ├── index.ts                              # Public API barrel → ./exports
    └── index.native.ts                       # Native public API barrel → ./exports
```
