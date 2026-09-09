# Pay Card Details

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Dual-platform flow package for the Pay tab **card details** for Ledger Wallet: the physical card
face, the freeze control, and the signed-in More menu.

The host owns currency formatting and the balance label, and hands both over as props. Card state
(status, freeze/unfreeze) is the package's own business: it reads it from the card API itself.
Session teardown uses `useCardLogout` from [`@features/flow-pay-card-auth`](../pay-card-auth/README.md).

## Usage

Web hosts lay freeze and More next to the card with `CardActions`:

```tsx
import { CardVisual, CardActions } from "@features/flow-pay-card-details";

<CardVisual balance={100} formatCountervalue={format} balanceLabel="Balance" />
<CardActions />
```

Native hosts mount a single `CardDetails`. Two buttons — a disabled placeholder and **Details** —
sit over the bottom of the card face, above a gradient that fades the artwork out behind them.
Pressing Details opens a bottom sheet with the full card UI (card face, `Freeze` and `More`),
where the actions stay below the card rather than over it:

```tsx
import { CardDetails } from "@features/flow-pay-card-details";

<CardDetails cardVisual={cardVisual} />;
```

`CardVisual` composes the `CardArtwork` (card face) with the balance overlay. `CardArtwork` is also
exported on its own for consumers that only need the card face. Hosts mount `CardDetails` and pass
`cardVisual` to overlay the balance, or omit it for the bare artwork. On web that keeps freeze and
More inline; on native they live in the Details bottom sheet.

The frozen state is not a host prop: `useCardVisualViewModel` reads the same `CardStatus` query the
freeze tile uses, so the card face and the tile can never disagree. A frozen card fades out and
takes a centered snow `Spot`.

`More` shows nothing until a Card session is live. Its Logout row calls `useCardLogout`.

## Platform resolution

Only the view carries a platform suffix (`.web` / `.native`). Barrels and platform-agnostic modules
import without a suffix; TypeScript `moduleSuffixes`, the bundlers (Rspack / Metro) and the jest
preset resolve the right side. Each view has a test importing it through its full platform filename.

The card artwork renders the halftone assets exported from Figma. Desktop imports the SVGs as URLs
through the bundler `asset/resource` rule. Native cannot do the same — the Repack assets loader
turns a `.svg` import into an image URI and `Image` cannot decode SVG — so `Halftone.native.tsx`
draws them with `react-native-svg` from the path data extracted verbatim into
`assets/halftone*Path.ts`. Each halftone is a single path, so this costs one node per pattern and
stays vector-crisp at any card size. The Visa logo is small enough to share one path constant
(`assets/visaLogoPath.ts`) and draw it inline on both platforms.

## Structure

Every `index.*` is a pure barrel (`export *` only).

```text
pay-card-details/
├── package.json
└── src/
    ├── assets.d.ts                            # `*.svg` module declarations
    ├── components/
    │   ├── CardArtwork/
    │   │   ├── CardArtwork.web.tsx            # Card face + halftone artwork + Visa logo
    │   │   ├── CardArtwork.native.tsx         # Native gradient, halftones + Visa logo
    │   │   ├── Halftone.native.tsx            # Halftone patterns drawn with react-native-svg
    │   │   ├── assets/                        # Figma SVGs (web) and shared / native path data
    │   │   ├── CardArtwork.web.test.tsx
    │   │   └── CardArtwork.native.test.tsx
    │   ├── CardVisual/
    │   │   ├── CardVisual.tsx
    │   │   ├── useCardVisualViewModel.ts      # Frozen state, read from the card status
    │   │   ├── CardVisualView.web.tsx         # Artwork + balance overlay + frozen marker
    │   │   ├── CardVisualView.native.tsx      # Artwork + balance overlay + frozen marker
    │   │   ├── CardVisual.web.test.tsx
    │   │   ├── CardVisual.native.test.tsx
    │   │   ├── CardVisualView.web.test.tsx
    │   │   └── CardVisualView.native.test.tsx
    │   ├── CardActions/
    │   │   └── CardActions.web.tsx            # Freeze + More in one row (web)
    │   ├── CardDetails/                       # Card block: web inline, native Details sheet
    │   │   ├── CardDetails.web.tsx            # Visual + CardActions
    │   │   ├── CardDetails.native.tsx         # View-model + view
    │   │   ├── useCardDetailsViewModel.ts     # Labels + sheet open state
    │   │   ├── CardDetailsView.native.tsx     # Card face + placeholder + Details buttons
    │   │   ├── CardDetailsSheet.native.tsx    # Bottom sheet: card face + Freeze + More
    │   │   ├── CardDetails.web.test.tsx
    │   │   ├── CardDetails.native.test.tsx
    │   │   └── CardDetailsSheet.native.test.tsx
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
    ├── index.ts                              # Public API barrel → ./exports (+ CardActions)
    └── index.native.ts                       # Native public API barrel → ./exports (+ CardDetails)
```
