# @shared/ui-animated-qr-code

> [!CAUTION]
> **Status: UNSTABLE**. Benchmark package: compares two ways to animate a QR code on mobile.

The same animated QR code built twice, so its performance can be compared in Ledger Wallet Mobile
(Settings → Debug → QR animation benchmark):

| Export                     | How the dots are drawn                                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `NativeAnimatedQrCode`     | A native view: `CALayer`s and `CADisplayLink` on iOS, `Canvas` and `Choreographer` on Android. Touches are handled natively; JS sends the QR matrix once. |
| `ReanimatedAnimatedQrCode` | One `Animated.View` per dot, styled by Reanimated worklets on the UI thread. Touches go through Gesture Handler, also on the UI thread.  |

Both take `AnimatedQrCodeProps`: `value`, `size`, `animation`, `centerContent`, `onPress` and
`autoPlay`.

## Animations

- `shimmer`: loading skeleton with a shimmer that ripples out from the center, then the code fades
  in. It loops for the benchmark.
- `copy`: on press, the center badge pops and a ripple of bigger dots runs from the center. No
  colour change.
- `hover`: on press, the dots around the finger grow until it lifts. Moving the finger does nothing.

`autoPlay` presses the code every 1.6 s by itself (a tap for `copy`, a 0.8 s hold for `hover`), so
the benchmark load stays steady. Only a press triggers an effect: the finger is never followed.

The timeline exists three times and must stay identical: `src/animationTimeline.ts`,
`ios/QrAnimationTimeline.swift` and `android/.../QrAnimationTimeline.kt`.

## Center badge

`centerContent` (for example a `CryptoIcon`) is a React node, which the native view cannot draw. Both
implementations show it through `AnimatedCenter`, animated with Reanimated. It is a single element,
so it does not skew the comparison.

## Native setup

The app gets the native view through autolinking: the package ships a podspec
(`SharedUiAnimatedQrCode`) and an Android library (`com.ledger.animatedqrcode`). The app must list
the package in its own `package.json`. The view is a legacy view manager rendered through the New
Architecture interop layer; it does not use codegen.
