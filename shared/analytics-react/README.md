# @shared/analytics-react

> [!CAUTION]
> **Status: UNSTABLE** — New package; consumers are wired in under LIVE-35068 (Desktop) and LIVE-35069 (Mobile).

The React layer over [`@shared/analytics`](../analytics/README.md): components that track through the
React lifecycle instead of calling the pipeline by hand.

The split is a hard boundary. Everything React lives here so `apps/wallet-cli` — Node, no React, no
Redux — can consume the pipeline without pulling React into its bundle.

## Exports

| Component | Entry point | Trigger | Backing call |
| --- | --- | --- | --- |
| `<Track>` | both | `onMount` / `onUnmount` / `onUpdate` props | `track` |
| `<TrackPage>` | web | mount | `trackPage` |
| `<TrackScreen>` | native | `useIsFocused()` | `screen` |

`<TrackPage>` and `<TrackScreen>` are deliberately **not** merged: page events are Desktop's model
(one event per mount) and screen events are Mobile's (one event per focus, de-dupable). Desktop keeps
using `<TrackPage>`, Mobile keeps using `<TrackScreen>`.

Every prop other than the named ones is sent as an event property, **flat**. There is no
`eventProperties` wrapper prop: passing `eventProperties={{ language: "fr" }}` sends a nested
`{ eventProperties: { language: "fr" } }`. Desktop's `<Button>` does take a prop of that name, which
makes this an easy mistake.

## Usage

```tsx
import { Track } from "@shared/analytics-react";

<Track
  onMount
  event={`Discoverability - Prompt - ${defaultLanguage}`}
  language={defaultLanguage}
/>;
```

```tsx
import { TrackPage } from "@shared/analytics-react";

<TrackPage category="Analytics Consent" name="Optional" flow="onboarding" />;
```

```tsx
import { TrackScreen } from "@shared/analytics-react";

<TrackScreen category="Asset" name="Bitcoin" avoidDuplicates />;
```

`setTrackingSource` and the route refs are **not** re-exported here — they belong to the React-free
core, at `@shared/analytics/screenRefs`.

## React hooks are not provided

`useAnalytics` and `useTrack` are deliberately absent. Each injected a property read from React
context that a module-level `track()` cannot see, and the two apps' versions had diverged too far to
reconcile. They are removed app-side before the wiring tickets land (LIVE-35840, LIVE-35841).

## Platform variants

`index.ts` (web) exposes `Track` and `TrackPage`; `index.native.ts` exposes `Track` and
`TrackScreen`. `@react-navigation/native` — needed only by `<TrackScreen>` — is an **optional** peer
dependency, so a web consumer never has to resolve it.
