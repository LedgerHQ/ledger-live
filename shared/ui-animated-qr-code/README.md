# @shared/ui-animated-qr-code

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

A QR code drawn and animated natively, for Ledger Wallet Mobile: a skeleton shimmer while the
value loads, and a ripple when the user copies it. A
[benchmark](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7724990565) chose native views
over one Reanimated view per dot, which drops frames on dense codes.

## Entries

| Entry      | Exports                                      |
| ---------- | -------------------------------------------- |
| `./native` | `AnimatedQrCode`, `AnimatedQrCodeProps`, `QrAnimation` |

```tsx
import { AnimatedQrCode } from "@shared/ui-animated-qr-code/native";

<AnimatedQrCode
  value={address}
  size={208}
  animation={address ? "ripple" : "loading"}
  centerContent={<CryptoIcon ledgerId={ledgerId} ticker={ticker} size={48} />}
  onPress={copyAddress}
  accessibilityLabel={t("receive.copyAddress")}
  triggerKey={copyButtonPresses}
/>;
```

## Animations

- `loading`: gray dots with a lighter band rippling out from the center, for as long as the value
  is not known. With `centerContent`, the center shows a gray disc in its place.
- `ripple`: on press, a ripple of bigger dots runs from the center and `centerContent` pops. No
  color change. A new `triggerKey` plays the same animation, e.g. from a separate button; the
  first value plays nothing.

With reduced motion on in the OS, the code is drawn still: no shimmer, no ripple.

## Center content

`centerContent` is optional. With it, the code keeps a clear zone in its middle for the node.
Without it, the code is drawn whole, with no hole.

## How it works

- `src/qrMatrix.ts` encodes the value with [`qrcode`](https://www.npmjs.com/package/qrcode), error
  correction H so a center content can cover the middle, and sends the dark modules to the native
  view once.
- The native view draws the dots and the three finders: one `CALayer` per element and a
  `CADisplayLink` on iOS, a `Canvas` and `Choreographer` on Android. It handles its own touches and
  only runs its frame loop while something moves.
- `centerContent` is a React node, which the native view cannot draw: `AnimatedCenter` animates it
  with Reanimated, on a clock of its own.

The timeline exists three times and must stay identical: `src/animationTimeline.ts`,
`ios/QrAnimationTimeline.swift` and `android/.../QrAnimationTimeline.kt`.

## Native setup

The app gets the native view through autolinking: the package ships a podspec
(`SharedUiAnimatedQrCode`) and an Android library (`com.ledger.animatedqrcode`). The app must list
the package in its own `package.json`. The view is a legacy view manager rendered through the New
Architecture interop layer; it does not use codegen.

## Tests

`pnpm test` runs the TS side: the timeline, the matrix, the clock and the component. Local stubs in
`jest/mocks/` replace React Native and Reanimated: `runFrame` drives the frame callbacks and
`setReducedMotion` the OS setting. The Swift and Kotlin views are not covered by these tests.
