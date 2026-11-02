# @shared/analytics-react

> [!NOTE]
> **Status: STABLE** — React lifecycle adapters. Call `track` and `trackPage` from [`@shared/analytics`](../analytics/README.md). Import the components below from this package.

## Exports

| Export             | Platform     | Description                                         |
| ------------------ | ------------ | --------------------------------------------------- |
| `Track`            | web + native | Fire `track` on mount, unmount, or prop updates     |
| `TrackScreen`      | web + native | Fire `trackPage` for the page or screen on display  |
| `TrackScreenProps` | web + native | Props of `TrackScreen`, shared by both platforms    |

`TrackScreen` has one contract and tracks the way each platform needs:

- **Web** fires `trackPage` on mount and again whenever category, name, properties, `refreshSource` or `mandatory` change. A re-render with deeply equal props sends nothing.
- **Native** fires `trackPage` when the screen gains focus. A mounted screen that is not focused sends nothing. `avoidDuplicates` drops the event when the last screen event was this same one; web ignores it.

## Usage

```tsx
import { Track, TrackScreen } from "@shared/analytics-react";

<TrackScreen category="Portfolio" name="Home" flow="main" />
<TrackScreen category="Asset" name="Bitcoin" ticker="BTC" avoidDuplicates />
<Track onMount event="Drawer Opened" drawer="send" />
```

Extra props on the component become event properties. `mandatory` sends the event even when consent is off. `TrackScreen` defaults `refreshSource` to true.
