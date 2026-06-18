---
"live-mobile": patch
---

Fix being unable to scroll the Asset Detail page on iOS while touching the chart. The page now uses the `react-native-gesture-handler` `ScrollView` so the chart scrubber's gesture coordinates with scrolling instead of capturing the touch.
