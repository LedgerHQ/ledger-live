---
"live-mobile": minor
---

Wire Global Search results: as the user types (debounced), search across all asset types via DADA and expose `searchResults`, `isLoadingSearch`, and `hasNoResults`. Input handling and the `search_query` tracking event use the shared `useSearchCommon` hook.
