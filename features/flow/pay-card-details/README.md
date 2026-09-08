# Pay Card Details

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Dual-platform flow package for the Pay tab **card visual** for Ledger Wallet: the physical card
face (dark gradient + halftone artwork + network logo) and, on top of it, the card balance overlay.

The host owns currency formatting and the balance label, and hands both over as props. Card state
(status, freeze/unfreeze) is the package's own business: it reads it from the card API itself.

## Usage

```tsx
import { CardVisual } from "@features/flow-pay-card-details";

<CardVisual balance={100} formatCountervalue={format} balanceLabel="Balance" />;
```

`CardVisual` composes the `CardArtwork` (card face) with the balance overlay. `CardArtwork` is also
exported on its own for consumers that only need the card face.

The frozen state is not a host prop: `useCardVisualViewModel` reads the same `CardStatus` query the
freeze tile uses, so the card face and the tile can never disagree. A frozen card fades out and
takes a centered snow `Spot`.

## Platform resolution

Only the view carries a platform suffix (`.web` / `.native`). Barrels and platform-agnostic modules
import without a suffix; TypeScript `moduleSuffixes`, the bundlers (Rspack / Metro) and the jest
preset resolve the right side. Each view has a test importing it through its full platform filename.

The desktop artwork renders the halftone SVGs exported from Figma (imported as URLs via the bundler
`asset/resource` rule). The native side is a minimal dark frame until an LWM design lands.

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
    │   ├── CardVisual/
    │   │   ├── CardVisual.tsx
    │   │   ├── useCardVisualViewModel.ts      # Frozen state, read from the card status
    │   │   ├── CardVisualView.web.tsx         # Artwork + balance overlay + frozen marker
    │   │   ├── CardVisualView.native.tsx      # Empty stub until LWM design
    │   │   ├── CardVisual.web.test.tsx
    │   │   ├── CardVisual.native.test.tsx
    │   │   ├── CardVisualView.web.test.tsx
    │   │   └── CardVisualView.native.test.tsx
    │   └── Freeze/
    │       ├── Freeze.web.tsx                 # Tile + confirmation, wired to the view model
    │       ├── Freeze.native.tsx
    │       ├── useFreezeCardViewModel.ts      # Card status, freeze/unfreeze, confirmation state
    │       ├── freezeCopy.ts                  # Freeze vs unfreeze i18n keys, keyed by card status
    │       ├── Tile/                          # Freeze / unfreeze control, and the sheet it opens
    │       │   ├── Tile.web.tsx
    │       │   └── Tile.native.tsx
    │       └── Confirm/                       # The one confirmation: freeze, or unfreeze
    │           ├── ConfirmSheet.web.tsx       # Dialog shell, picks prompt or error
    │           ├── ConfirmSheet.native.tsx    # Bottom sheet shell, same choice
    │           ├── ConfirmPrompt.tsx          # "Freeze?" state, platform-agnostic
    │           ├── ConfirmError.tsx           # "It failed" state, platform-agnostic
    │           ├── ConfirmBody.web.tsx        # Spot + title + description + the two buttons
    │           └── ConfirmBody.native.tsx     # Same body, and it tints the sheet
    ├── types.ts                               # Public props / view-model types
    ├── exports.ts                             # Public surface
    ├── index.ts                              # Public API barrel → ./exports
    └── index.native.ts                       # Native public API barrel → ./exports
```
