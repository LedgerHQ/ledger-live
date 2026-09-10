# Pay Card Details

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Dual-platform flow package for the Pay tab **card details** for Ledger Wallet: the physical card
face, the freeze control, and the signed-in More menu.

The host owns currency formatting and the balance label, and hands both over as props. Card state
(status, freeze/unfreeze) is the package's own business: it reads it from the card API itself.
Session teardown uses `useCardLogout` from [`@features/flow-pay-card-auth`](../pay-card-auth/README.md).

## Usage

```tsx
import { CardVisual, CardNumbers, CardActions } from "@features/flow-pay-card-details";

<CardNumbers unlock={unlock} cardFace={<CardVisual {...cardVisual} />} />
```

`CardVisual` composes the `CardArtwork` (card face) with the balance overlay. `CardArtwork` is also
exported on its own for consumers that only need the card face. On web, `CardNumbers` flips the face
to the PAN/CVV image and mounts View on the `CardActions` row (Freeze + More). Without `unlock`,
hosts mount the face and `CardActions` themselves. Native hosts mount `Freeze` and `More` separately.

The frozen state is not a host prop: `useCardVisualViewModel` reads the same `CardStatus` query the
freeze tile uses, so the card face and the tile can never disagree. A frozen card fades out and
takes a centered snow `Spot`.

`More` shows nothing until a Card session is live. Its Logout row calls `useCardLogout`.

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
    │       ├── CardActions/
    │   │   ├── CardActions.web.tsx            # Optional View + Freeze + More in one row (web)
    │   │   └── CardActions.native.tsx         # Null: native hosts mount Freeze and More separately
    │   ├── CardNumbers/
    │   │   ├── CardNumbers.web.tsx            # Flip + View on the CardActions row
    │   │   ├── CardNumbers.native.tsx         # Stub until LWM reveal UI
    │   │   ├── CardNumbersView.web.tsx        # Flip to the PAN/CVV image
    │   │   └── Tile/                          # View / Hide control
    │   ├── Freeze/
    │   │   ├── Freeze.web.tsx                 # Tile + confirmation, wired to the view model
    │   │   ├── Freeze.native.tsx
    │   │   ├── useFreezeCardViewModel.ts      # Card status, freeze/unfreeze, confirmation state
    │   │   ├── freezeCopy.ts                  # Freeze vs unfreeze i18n keys, keyed by card status
    │   │   ├── Tile/                          # Freeze / unfreeze control, and the sheet it opens
    │   │   │   ├── Tile.web.tsx
    │   │   │   └── Tile.native.tsx
    │   │   └── Confirm/                       # The one confirmation: freeze, or unfreeze
    │   │       ├── ConfirmSheet.web.tsx       # Dialog shell, picks prompt or error
    │   │       ├── ConfirmSheet.native.tsx    # Bottom sheet shell, same choice
    │   │       ├── ConfirmPrompt.tsx          # "Freeze?" state, platform-agnostic
    │   │       ├── ConfirmError.tsx           # "It failed" state, platform-agnostic
    │   │       ├── ConfirmBody.web.tsx        # Spot + title + description + the two buttons
    │   │       └── ConfirmBody.native.tsx     # Same body, and it tints the sheet
    │   └── More/
    │       ├── More.web.tsx                   # Tile + sheet, wired to the view model
    │       ├── More.native.tsx
    │       ├── useMoreViewModel.ts            # Signed-in user, sheet, logout
    │       ├── Tile/
    │       └── Sheet/
    ├── types.ts                               # Public props / view-model types
    ├── exports.ts                             # Public surface
    ├── index.ts                              # Public API barrel → ./exports
    └── index.native.ts                       # Native public API barrel → ./exports
```
