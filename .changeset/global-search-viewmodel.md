---
"live-mobile": patch
---

Extract the Global Search screen logic into `useGlobalSearchViewModel`, following the MVVM Container → ViewModel → View split. The ViewModel owns the search state, `isSearchActive`, back navigation, and `search_open` tracking, and exposes placeholders for the default sections and search results (wired in follow-up PRs).
