# Pay Card Details

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Dual-platform flow package for the Pay tab **card details** for Ledger Wallet: the physical card
face, the freeze control, and the signed-in More menu.

The host owns currency formatting and the balance label, and hands both over as props. Card state
(status, freeze/unfreeze) is the package's own business: it reads it from the card API itself.
Session teardown uses `useCardLogout` from [`@features/flow-pay-card-auth`](../pay-card-auth/README.md).

## Usage

Every host mounts a single `CardDetails`. Pass `unlock` to let the holder reveal the card numbers:

```tsx
import { CardDetails } from "@features/flow-pay-card-details";

<CardDetails cardVisual={cardVisual} unlock={unlock} />
```

Native hosts mount a single `CardDetails`. Two buttons — a disabled placeholder and **Details** —
sit over the bottom of the card face, above a gradient that fades the artwork out behind them.
Pressing Details opens one bottom sheet. Its card overview and the selected transaction use the
full-height snap point, while the `Freeze` confirmation and `More` menu resize to their content.
These scenes replace each other within that sheet so they do not compete for the global
bottom-sheet queue. Selecting a transaction also emits the injected tracking-plan
`transaction_clicked` event.

Each scene is a self-contained screen. The view model owns a single current `route` and drives it
through a small navigation contract (`goTo` / `goBack`, in `Scenes/navigation.ts`); the
sheet is a dumb shell that only renders the route it is given, sizing itself and showing its header
back button from `Scenes/registry.ts`.
Navigation is classic (one scene at a time, back to overview) but the same contract is deliberately
thin: adding a scene (transactions, assets) is a new route plus a tile that calls `goTo`, and the
scenes can later be mounted in a stack or as full pages without being rewritten.

```tsx
import { CardDetails } from "@features/flow-pay-card-details";

<CardDetails cardVisual={cardVisual} />;
```

Native hosts can also pass `assets`: whatever it holds is rendered in the sheet's overview, between
the card actions and the transactions, which is where the design lists the card's funding wallets.
The node comes from the host because the list itself lives in
[`@features/flow-pay-card`](../pay-card/README.md), above this package.

`CardVisual` composes the `CardArtwork` (card face) with the balance overlay. `CardArtwork` is also
exported on its own for consumers that only need the card face. Hosts mount `CardDetails` and pass
`cardVisual` to overlay the balance, or omit it for the bare artwork. On web that keeps freeze, More,
and View inline; on native freeze and More live in the Details bottom sheet.

On web `CardDetails` owns one reveal view model and passes it to `CardFlip` and `CardActions`.
Omit `unlock` and that value is `null`: the face never flips and `CardActions` lays out Freeze
and More alone.

Hide only drops the status, not the image URL. The card takes a flip to turn back, and clearing
the URL there would empty the face the moment the rotation starts; the next reveal clears it
before minting a fresh token.

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
    ├── assets.d.ts                            # `*.svg` / `*.webp` module declarations
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
    │   │   └── CardActions.web.tsx            # Optional Reveal + Freeze + More in one row (web)
    │   ├── CardDetails/                       # Card block: web inline, native Details sheet
    │   │   ├── CardDetails.web.tsx            # Reveal VM passed to CardFlip and CardActions
    │   │   ├── CardDetails.native.tsx         # View-model + view
    │   │   ├── useCardDetailsViewModel.ts     # Details, Freeze and More state
    │   │   ├── CardDetailsView.native.tsx     # Overlay actions on the card face + fade
    │   │   ├── CardDetailsSheet.native.tsx    # Adaptive sheet navigation and lifecycle
    │   │   ├── Scenes/                        # Self-contained sheet scenes (screens)
    │   │   │   ├── navigation.ts              # Route union + goTo / goBack contract
    │   │   │   ├── registry.native.ts         # Per-scene sheet sizing and back button
    │   │   │   ├── CardDetailsScene.native.tsx # Router: renders the current route
    │   │   │   ├── OverviewScene.native.tsx   # Card face + composable actions row
    │   │   │   ├── TransactionScene.native.tsx
    │   │   │   ├── FreezeScene.native.tsx
    │   │   │   └── MoreScene.native.tsx
    │   │   ├── CardDetails.web.test.tsx
    │   │   ├── CardDetails.native.test.tsx
    │   │   └── CardDetailsSheet.native.test.tsx
    │   ├── CardFlip/
    │   │   └── CardFlip.web.tsx               # Flip the card face to the PAN/CVV image
    │   ├── Reveal/
    │   │   ├── Reveal.web.tsx                 # View / Hide tile
    │   │   └── useRevealViewModel.ts          # Unlock, mint the token, hold the image URL
    │   ├── Freeze/
    │   │   ├── Freeze.web.tsx                 # Tile + confirmation, wired to the view model
    │   │   ├── Freeze.native.tsx              # Tile only; confirmation is a CardDetails scene
    │   │   ├── useFreezeCardViewModel.ts      # Card status, freeze/unfreeze, confirmation state
    │   │   ├── freezeCopy.ts                  # Freeze vs unfreeze i18n keys, keyed by card status
    │   │   ├── Tile/                          # Freeze / unfreeze control (native: action only)
    │   │   │   ├── Tile.web.tsx
    │   │   │   └── Tile.native.tsx
    │   │   └── Confirm/                       # The one confirmation: freeze, or unfreeze
    │   │       ├── ConfirmSheet.web.tsx       # Dialog shell, picks prompt or error
    │   │       ├── ConfirmPrompt.tsx          # "Freeze?" state, platform-agnostic
    │   │       ├── ConfirmError.tsx           # "It failed" state, platform-agnostic
    │   │       ├── ConfirmBody.web.tsx        # Spot + title + description + the two buttons
    │   │       └── ConfirmBody.native.tsx     # Same body, and it tints the sheet
    │   └── More/
    │       ├── More.web.tsx                   # Tile + sheet, wired to the view model
    │       ├── More.native.tsx                # Tile only; menu is a CardDetails scene
    │       ├── useMoreViewModel.ts            # Signed-in user, sheet, logout
    │       ├── Tile/
    │       └── Sheet/
    ├── types.ts                               # Public props / view-model types
    ├── exports.web.ts                         # Public surface
    ├── exports.native.ts                      # Public surface
    ├── index.ts                              # Public API barrel → ./exports
    └── index.native.ts                       # Public API barrel → ./exports
```
