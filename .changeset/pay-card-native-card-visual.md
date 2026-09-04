---
"@features/flow-pay-card-details": minor
"@features/flow-pay-card": minor
"@support/jest-features-flow": patch
"live-mobile": minor
---

Render the Pay card visual on React Native, replacing the `null` stubs.

- `CardArtwork.native` draws the card face with lumen's `LinearGradient` and the halftone/Visa artwork as `react-native-svg` paths.
- Sized by the artwork's 16:9 ratio, not the web's fixed 195px height, so it keeps its proportions at any card width.
- `CardVisualView.native` stacks the caption and `AmountDisplay` over it, scoped to the dark color scheme.
- `PayTab` passes `formatCountervalue` and `balanceLabel`, without which the card fell back to the bare artwork.
- The Pay tab scrolls, and pads for the tab bar: the card face makes the page taller than the viewport.
- The placeholder card balance is 0 until the balance API is wired.
- Stub `react-native-svg` in the shared flow jest config.
