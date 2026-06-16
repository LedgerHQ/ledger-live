---
"live-mobile": patch
---

Polish the Global Search feature: prices and market caps now follow the user's counter-value currency setting (converting DADA's USD values via the USD→fiat rate, matching the Modular Asset Drawer), the results and default views show an error state when their data fails to load, the header back button aligns with the other screens, and the GlobalSearch analytics events (`search_open`, `search_query`, `asset_clicked`) are wired per the tracking plan. Data hooks moved to a feature-level `hooks/` folder to match the MVVM architecture.
