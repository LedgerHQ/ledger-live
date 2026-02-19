---
"live-mobile": minor
---

feat(mobile): Lottie splash screen support and staging/Repack compatibility

- Add LottieLauncher with Splashscreen.lottie for animated splash (no JSON fallback)
- Fix splash animation in staging: Repack returns path instead of file:// URI; use asset id when URI is not absolute so lottie-react-native loads correctly
- Add shared resolveLottieSource(module) in Lottie component for any .lottie usage (dev + staging)
- Lottie component accepts source as number (asset id) with safe cast for lottie-react-native types
- rspack.config: add .lottie to resolve.extensions and pass platform to assets-loader; optional custom loader injects fileSystemLocation in production for AssetRegistry descriptor
