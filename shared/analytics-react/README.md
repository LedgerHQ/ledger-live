# @shared/analytics-react

> [!NOTE]
> **Status: STABLE** — React lifecycle adapters. Call `track` and `trackPage` from [`@shared/analytics`](../analytics/README.md). Import the components below from this package.

## Exports

| Export        | Platform     | Description                                                |
| ------------- | ------------ | ---------------------------------------------------------- |
| `Track`       | web + native | Fire `track` on mount, unmount, or prop updates            |
| `TrackPage`   | web          | Fire `trackPage` when category, name, or properties change |
| `TrackScreen` | native       | Fire `trackPage` when the screen gains focus               |

`TrackPage` and `TrackScreen` stay distinct: web tracks page views on prop changes; native tracks only when focused and supports `avoidDuplicates`.

## Usage

```tsx
import { Track, TrackPage } from "@shared/analytics-react";

<TrackPage category="Portfolio" name="Home" flow="main" />
<Track onMount event="Drawer Opened" drawer="send" />
```

```tsx
import { TrackScreen } from "@shared/analytics-react";

<TrackScreen category="Asset" name="Bitcoin" ticker="BTC" avoidDuplicates />
```

Extra props on the component become event properties. `mandatory` sends the event even when consent is off. `TrackPage` and `TrackScreen` default `refreshSource` to true.
