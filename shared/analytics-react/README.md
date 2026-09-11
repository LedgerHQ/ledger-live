# @shared/analytics-react

> [!CAUTION] > **Status: UNSTABLE** — New package for LIVE-37158; API may change before app wiring lands.

React lifecycle adapters for the shared analytics pipeline. Use this package in React-based apps.
For the React-free tracking core, see [`@shared/analytics`](../analytics/).

## Exports

| Export        | Platform     | Description                                         |
| ------------- | ------------ | --------------------------------------------------- |
| `Track`       | web + native | Fire `track` on mount, unmount, or prop updates     |
| `TrackPage`   | web          | Fire `trackPage` once on mount (web page views)     |
| `TrackScreen` | native       | Fire `trackPage` when the mobile screen gains focus |

`TrackPage` and `TrackScreen` stay distinct: web mounts a page once; native tracks only when
focused and supports `avoidDuplicates`.

## Usage

```tsx
import { Track, TrackPage } from "@shared/analytics-react";

// React — page view on mount
<TrackPage category="Portfolio" flow="main" />

// Lifecycle event
<Track onMount event="Drawer Opened" drawer="send" />
```

```tsx
import { Track, TrackScreen } from "@shared/analytics-react";

// React Native — screen view when focused
<TrackScreen category="Asset" name="Bitcoin" ticker="BTC" avoidDuplicates />;
```
