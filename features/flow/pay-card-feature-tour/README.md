# Pay Card Feature Tour

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

First-time Pay tab feature tour for Ledger Wallet, presented as a queued bottom sheet on
mobile and a dialog on desktop, shown once until the user dismisses it.

## Usage

This package is **copy-agnostic**: it renders whatever strings the host passes in and never
imports an i18n library. The app owns the translation keys and resolves them with its own
`useTranslation()`/`t()` before mounting the tour (same pattern as `@features/flow-contacts`).

```tsx
import { FeatureTour, type FeatureTourContent } from "@features/flow-pay-card-feature-tour";
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
      icon: "Chart2",
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

<FeatureTour {...content} onTrackScreen={trackScreen} onTrackEvent={trackEvent} />;
```

The `icon` field is a Lumen symbol name resolved per platform, so the app picks the glyph
while the copy stays translatable. Translation keys and the app-side wiring live in the host
app (tracked separately in the mount ticket), keeping this package free of hardcoded strings.

Visibility is derived from the shared `@domain/entity-pay-card` slice
(`hasSeenFeatureTour`). Dismissing the tour (Got it, close button, or backdrop) dispatches
`markPayCardFeatureTourSeen` once. Analytics are injected via the optional `onTrackScreen` /
`onTrackEvent` props so the flow stays decoupled from any app analytics package.

## Platform resolution

Platform files live side by side (`.web` / `.native`). Imports omit the suffix; TypeScript
`moduleSuffixes` and the bundlers resolve the right file.

| Platform         | File resolved                          |
| ---------------- | -------------------------------------- |
| Mobile (Metro)   | `FeatureTour/index.native.tsx`         |
| Desktop (Rspack) | `FeatureTour/index.web.tsx`            |

The native view consumes `QueuedBottomSheet` from `@shared/queued-bottom-sheet` so queueing
behaviour stays consistent with the rest of the app.

## Structure

```text
pay-card-feature-tour/
├── package.json
└── src/
    ├── index.ts                              # Default/web public API
    ├── index.native.ts                       # Native public API
    └── components/
        └── FeatureTour/
            ├── __tests__/
            │   ├── FeatureTour.native.test.tsx
            │   └── FeatureTour.web.test.tsx
            ├── FeatureTourView.native.tsx     # Native presentational UI (QueuedBottomSheet)
            ├── FeatureTourView.web.tsx        # Web presentational UI (Dialog)
            ├── index.native.tsx              # Native container
            ├── index.web.tsx                 # Web container
            ├── index.ts                      # Default/web container barrel
            ├── payTabTour.webp               # Hero image
            └── useFeatureTourViewModel.ts    # Shared state and orchestration
```

The view shows a hero image, title, subtitle, and three Lumen `ListItem` feature rows
(Globe / Chart2 / CreditCard) inside a queued bottom sheet (mobile) or dialog (desktop),
with a single "Got it" CTA to dismiss.
