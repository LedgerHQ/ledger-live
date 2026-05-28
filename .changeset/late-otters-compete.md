---
"live-mobile": minor
---

Replace the Asset Detail BalanceGraph SVG placeholder with a real Lumen LineChart. Adds a 1D / 1W / 1M / 1Y range selector whose change drives the chart line color (success / error / muted), and extracts a reusable `LineChart` component (chart plot + segmented control) under `mvvm/components/`.
