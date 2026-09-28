# Pay analytics

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Shared Pay tracking helpers for Desktop and Mobile. Apps inject a platform adapter; screens consume `usePayAnalyticsContext` from a `PayAnalyticsProvider` above the Pay ViewModel.

```tsx
import { PayAnalyticsProvider, usePayAnalyticsContext } from "@features/platform-pay-analytics";

<PayAnalyticsProvider adapter={createPayAnalyticsAdapter()}>
  <PayTabContent />
</PayAnalyticsProvider>
```
