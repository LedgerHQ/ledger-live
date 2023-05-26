---
"live-mobile": minor
---

chore: bumped react-native-reanimated to v3.1.0

Our usage of react-native-reanimated in v2.15 was creating freezing issues on iOS.

- Bumped react-native-reanimated to v3.1.0.
- Added necessary babel plugins to devDependencies that are needed for react-native-reanimated.
- Also updated metro.config.js to stop forcing resolving react-native-reanimated from the LLM folder as it was creating import issues.
- Bumped lottie-react-native to 6.0.0-rc.6
- Needed because with Reanimated 3, Lottie from lottie-react-native v5.1.5 were not working correctly anymore

Also adapted a bunch of components that were still using the v1 api of reanimated -> I wrote a plan for QA to double check them

After adapting those components, removed the following unused components/libs:

- react-native-redash dependency : unused
- lottie-ios dependency: unneeded since lottie-react-native > 5.1.4
- some components that were used by an old onboarding that cannot be reach anymore
