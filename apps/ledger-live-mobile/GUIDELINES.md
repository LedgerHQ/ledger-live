## Devs guidelines

- Stick to React Native defaults as much as possible. Do not change too much how the project is built (no webpack or packager changes). RN config is already a pain to configure with all the native libraries.
- keep component minimal. A React component file is < 200 LoC. split into sub components.
- try to push the connect() at the lowest level possible to avoid full re-renderering.
- For any updates involving animation, use Animated and with native mode. Never use setState at high rate.
- In this project, do not create too much nesting (we use relative import). The fundamental scripts (db, constants, ..) will be in src. The modals are in src/modals, The screens are in src/screens, The components are straight into src/components/ (without much nesting). For components, only allowed is to create a folder (e.g. for a screen, it have index.js and other components that only make sense for the screen next to it.)
- We will use StyleSheet.create directly and the React Native components directly. Only exception is for text, we'll never use ReactNative's Text but should use LText.
- Be extremely careful about bumping React Native. (Aug 18: gre: I've chosen not to update to latest RN that updated to babel beta, so did Expo https://blog.expo.io/expo-sdk-v29-0-0-is-now-available-f001d77fadf – in future we might even consider using Expo's RN fork that is usually more stable)
