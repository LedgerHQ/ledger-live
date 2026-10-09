# @shared/lottie

> [!CAUTION]
> **Status: UNSTABLE** — New package; consumers are still migrating off `react-lottie` and direct `lottie-react-native` imports.

Single entry point for Lottie animations. Apps and features import `Lottie` from here instead of
depending on a player library, so swapping the engine is a change to this package only. The
`lottie-web` based `react-lottie` is unmaintained and is not used.

- **web** — [`@lottiefiles/dotlottie-react`](https://www.npmjs.com/package/@lottiefiles/dotlottie-react) (ThorVG/WASM)
- **native** — [`lottie-react-native`](https://github.com/lottie-react-native/lottie-react-native)

`lottie-react-native` is a peer dependency: React Native autolinking only scans the app's own
`package.json`, so the mobile app keeps declaring it.

## Exports

| Export         | Description                                                           |
| -------------- | --------------------------------------------------------------------- |
| `Lottie`       | Animation player; `source`, `loop`, `autoPlay`, `paused`, `speed`, `style`, `testID`, `onComplete` on both platforms |
| `LottieProps`  | Component props                                                       |
| `LottieSource` | Accepted `source` values                                              |

Web only: `fit`, `align`, `role`, `className`. `source` is a URL (`.lottie`
or `.json`) or parsed animation data; keep data objects referentially stable, a new object reloads
the animation.

Native only: `source` also accepts `{ uri }` and bundler asset ids.
