# @domain/entity-predictions

> [!CAUTION]
> **Status: UNSTABLE** — New package; it only holds the intro flag for now and will grow with Predictions.

What Ledger Wallet remembers about the Predictions live app, shared by desktop and mobile. Today it is whether the user has seen the Predictions intro, which `custom.predictions.onboard` reads to show it only once.

## Exports

- `predictionsSlice`, with `markPredictionsIntroSeen` and `restorePredictionsState` (parses the persisted value, falls back to the initial state)
- `selectHasSeenIntro`, nested in the slice so it reads the app's root state
- `PredictionsStateSchema`, `PredictionsState`, `initialPredictionsState`

Each app registers the reducer under `predictions` and persists it like its other slices.
