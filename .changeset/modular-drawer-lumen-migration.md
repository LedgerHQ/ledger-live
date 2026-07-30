---
"live-mobile": minor
"@ledgerhq/native-ui": minor
---

Migrate the mobile Modular Drawer to Lumen components (BottomSheet, ListItem, SearchInput, Banner, CardButton, Trend, Tag, Box/Text) and drop the legacy `native-ui` primitives and the `pre-ldls` composites it used. Removes the now-unused `pre-ldls` staging components (AssetItem, NetworkItem, AccountItem, Address, Tag, Input, Search, AssetTypeList, NetworkList, MarketPriceIndicator, MarketPercentIndicator) and the orphaned `useDebouncedCallback` hook from `@ledgerhq/native-ui` (CryptoIcon and AddAccountButton are kept). Adds the empty-account state (header description + "Add account" CardButton) on the account step.
