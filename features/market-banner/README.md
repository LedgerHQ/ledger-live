# Market Banner

Cross-platform banner component for Ledger Live.

## Usage

```tsx
import { MarketBanner } from "@features/market-banner";

<MarketBanner />;
```

## Platform Resolution

| Platform         | File resolved                                 |
| ---------------- | --------------------------------------------- |
| Mobile (Metro)   | `index.native.ts` → `MarketBanner.native.tsx` |
| Desktop (Rspack) | `index.ts` → `MarketBanner.web.tsx`           |

The bundlers automatically resolve the correct platform-specific implementation.
