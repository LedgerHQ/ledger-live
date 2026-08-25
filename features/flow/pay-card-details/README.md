# Pay Card Details

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Dual-platform flow package for the Pay tab **card visual** for Ledger Wallet. This first slice ships
the physical card face (`CardArtwork`): a dark gradient with the halftone artwork and the network
logo. The balance overlay is added on top in a follow-up.

Props-only and i18n-agnostic — the host owns data fetching, currency formatting and labels.

## Usage

```tsx
import { CardArtwork } from "@features/flow-pay-card-details";

<CardArtwork />;
```

## Platform resolution

Only the view carries a platform suffix (`.web` / `.native`). Barrels and platform-agnostic modules
import without a suffix; TypeScript `moduleSuffixes`, the bundlers (Rspack / Metro) and the jest
preset resolve the right side. Each view has a test importing it through its full platform filename.

The desktop artwork renders the halftone SVGs exported from Figma (imported as URLs via the bundler
`asset/resource` rule). Native `CardArtwork` is an empty stub until an LWM design lands.

## Structure

Every `index.*` is a pure barrel (`export *` only).

```text
pay-card-details/
├── package.json
└── src/
    ├── assets.d.ts                            # `*.svg` module declaration (URL default export)
    ├── components/
    │   └── CardArtwork/
    │       ├── CardArtwork.web.tsx            # Card face + halftone artwork + Visa logo
│       ├── CardArtwork.native.tsx         # Empty stub until LWM design
│       ├── assets/                        # Figma-exported SVGs
│       ├── CardArtwork.web.test.tsx
│       └── CardArtwork.native.test.tsx
    ├── exports.ts                             # Public surface
    ├── index.ts                              # Public API barrel → ./exports
    └── index.native.ts                       # Native public API barrel → ./exports
```
