# Pay Feature Tour

> [!CAUTION] > **Status: UNSTABLE** — In active development; API may change.

First-time Pay tab feature tour for Ledger Wallet, presented as a queued bottom sheet on
mobile and a dialog on desktop, shown once until the user dismisses it.

## Usage

This package is **copy-agnostic**: it renders whatever strings the host passes in and never
imports an i18n library. The app owns the translation keys and resolves them with its own
`useTranslation()`/`t()` before mounting the tour (same pattern as `@features/flow-contacts`).

```tsx
import {
  FeatureTour,
  type FeatureTourContent,
} from "@features/flow-pay-feature-tour";
import { useTranslation } from "~/context/Locale";

const { t } = useTranslation();

const content: FeatureTourContent = {
  title: t("payCardFeatureTour.title"),
  description: t("payCardFeatureTour.description"),
  ctaLabel: t("payCardFeatureTour.cta"),
  rows: [
    {
      icon: "Globe",
      title: t("payCardFeatureTour.rows.global.title"),
      description: t("payCardFeatureTour.rows.global.description"),
    },
    {
      icon: "Chart5",
      title: t("payCardFeatureTour.rows.volatility.title"),
      description: t("payCardFeatureTour.rows.volatility.description"),
    },
    {
      icon: "CreditCard",
      title: t("payCardFeatureTour.rows.card.title"),
      description: t("payCardFeatureTour.rows.card.description"),
    },
  ],
};

<FeatureTour
  {...content}
  onTrackScreen={trackScreen}
  onTrackEvent={trackEvent}
/>;
```

The `icon` field is a Lumen symbol name resolved per platform, so the app picks the glyph
while the copy stays translatable. Translation keys and the app-side wiring live in the host
app (tracked separately in the mount ticket), keeping this package free of hardcoded strings.

Visibility is derived from this flow's `payCardFeatureTour` slice (`hasSeenFeatureTour`),
exposed through `@features/flow-pay-feature-tour/state`. Store, persistence and test
setup should import that entry so they do not load the tour UI. Dismissing the tour (Got it, close
button, or backdrop) dispatches `markPayCardFeatureTourSeen` once. Analytics are injected via the
optional `onTrackScreen` / `onTrackEvent` props so the flow stays decoupled from any app analytics
package.

## Platform resolution

Only the view carries a platform suffix. Everything above it — barrels, container, view model,
types — is platform-agnostic and imports `./FeatureTourView` without a suffix; TypeScript
`moduleSuffixes`, the bundlers and the jest preset resolve the right side.

| Platform | `./FeatureTourView` resolves to | Resolved by              |
| -------- | ------------------------------- | ------------------------ |
| Mobile   | `FeatureTourView.native.tsx`    | Metro, `tsconfig.native` |
| Desktop  | `FeatureTourView.web.tsx`       | Rspack, `tsconfig.web`   |

The native view consumes `QueuedBottomSheet` from `@shared/ui-queued-bottom-sheet` so queueing
behaviour stays consistent with the rest of the app.

Each view also has a test importing it through its full `.web` / `.native` filename. Dead-code
analysis (knip) reads only the solution `tsconfig.json`, which declares no `moduleSuffixes`, so a
suffixed file it can reach through no other path would be reported as dead.

## Structure

```text
pay-feature-tour/
├── package.json
└── src/
    ├── index.ts                              # Public API (default)
    ├── index.native.ts                       # Public API (react-native condition)
    ├── state/                                # UI-free Redux slice (`./state` export)
    └── components/
        └── FeatureTour/
            ├── __tests__/
            │   ├── FeatureTour.native.test.tsx
            │   ├── FeatureTour.web.test.tsx
            │   ├── FeatureTourView.native.test.tsx
            │   └── FeatureTourView.web.test.tsx
            ├── FeatureTour.tsx                # Container, both platforms
            ├── FeatureTourView.native.tsx     # Native presentational UI (QueuedBottomSheet)
            ├── FeatureTourView.web.tsx        # Web presentational UI (Dialog)
            ├── index.ts                       # Barrel
            ├── payTabTour.webp                # Hero image
            ├── types.ts                       # Public props and content types
            └── useFeatureTourViewModel.ts     # Shared state and orchestration
```

The view shows a hero image, title, subtitle, and three Lumen `ListItem` feature rows
(Globe / Chart5 / CreditCard) inside a queued bottom sheet (mobile) or dialog (desktop),
with a single "Got it" CTA to dismiss.
