---
"ledger-live-desktop": minor
---

Add live asset search results to the top-bar search overlay. Typing a query (debounced, min 2 chars) fetches matching assets from DADA via `useAssetSearchResultsViewModel` and renders them as a flat list, with dedicated empty ("No asset found") and error ("Connection failed") states. The asset row gains a `default` density for the expanded results layout, and the clear button no longer toggles the overlay.
