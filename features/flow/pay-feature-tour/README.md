# Pay Feature Tour

> [!CAUTION] > **Status: UNSTABLE** — In active development; API may change.

First-time Pay tab feature tour for Ledger Wallet, presented as a queued bottom sheet on
mobile and a dialog on desktop, shown once until the user dismisses it.

## Usage

Copy lives with the feature: the tour resolves its own strings through
[`@shared/i18n`](../../../shared/i18n), so the host only injects analytics.

```tsx
import { FeatureTour } from "@features/flow-pay-feature-tour";

<FeatureTour onTrackScreen={trackScreen} onTrackEvent={trackEvent} />;
```

The keys it reads, in the host app's **default** namespace (`app` on Desktop, `common` on Mobile):

| Key | Rendered as |
| --- | --- |
| `payTab.featureTour.title` | Sheet title |
| `payTab.featureTour.description` | Sheet subtitle |
| `payTab.featureTour.cta` | Dismiss button |
| `payTab.featureTour.rows.global.{title,description}` | Row 1 (`Globe`) |
| `payTab.featureTour.rows.volatility.{title,description}` | Row 2 (`Chart5`) |
| `payTab.featureTour.rows.card.{title,description}` | Row 3 (`CreditCard`) |

Both apps must carry these keys at the same path until translation keys are colocated per feature
(a follow-up of [LIVE-36540](https://ledgerhq.atlassian.net/browse/LIVE-36540)). The row icons are
Lumen symbol names resolved per platform and stay owned by this package.

Tests wrap the component in `I18nTestProvider` from `@shared/i18n/testing`.

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
            ├── types.ts                       # Public props and row types
            └── useFeatureTourViewModel.ts     # Shared state and orchestration
```

The view shows a hero image, title, subtitle, and three Lumen `ListItem` feature rows
(Globe / Chart5 / CreditCard) inside a queued bottom sheet (mobile) or dialog (desktop),
with a single "Got it" CTA to dismiss.
