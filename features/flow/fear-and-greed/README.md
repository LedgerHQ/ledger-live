# @features/flow-fear-and-greed

> [!CAUTION]
> **Status: UNSTABLE** — In active development.

Fear and Greed mood index for Ledger Wallet desktop and mobile.

- `utils/fearAndGreed.ts` maps a value (0-100) to a level, a translation key, and a color token, and gates the index by region with `isMoodIndexAvailable`.
- `FearAndGreed` is the portfolio tile. Pass the app arc gauge as `Gauge`. Desktop and mobile resolve their own `.web` / `.native` files.
- Desktop Market and the mobile highlights pass `appearance="expanded"`.

The canonical data model lives in `@domain/entity-market-index-fear-and-greed`. The RTK Query endpoint lives in `@domain/api-market-index-fear-and-greed`. Locale lookup stays in each app.

## Usage

```tsx
import { FearAndGreed, isMoodIndexAvailable } from "@features/flow-fear-and-greed";

if (isMoodIndexAvailable(region)) {
  <FearAndGreed Gauge={ArcGaugeIndicator} />;
}
```
