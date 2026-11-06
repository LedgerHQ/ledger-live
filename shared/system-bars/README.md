# @shared/system-bars

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Themes the Android system navigation bar (the bar with the back and home buttons) from React Native.
It wraps [`expo-navigation-bar`](https://docs.expo.dev/versions/latest/sdk/navigation-bar/), so
apps never import the library.

On iOS every call does nothing: iOS has no navigation bar.

## Exports

| Export                           | Description                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `applyNavigationBarTheme`        | `({ isDark, backgroundColor, paintBackground? }) => void` — picks readable button colors and paints the bar |
| `NavigationBarBackgroundPainter` | `(argbColor: number) => void` — app-provided native call that paints the bar                                |
| `NavigationBarTheme`             | Type of the argument above                                                                                  |

## Usage

```ts
import { applyNavigationBarTheme } from "@shared/system-bars";

applyNavigationBarTheme({ isDark, backgroundColor, paintBackground });
```

The native call is fire-and-forget: `expo-navigation-bar` does not return its Promise, so a native
failure cannot be caught here.

## Background color

`expo-navigation-bar` 57 (Expo SDK 57) has no background color API. The app injects
`paintBackground`, which gets the color as an Android ARGB number; without it only the button color
changes. Ledger Wallet Mobile passes its native `NavigationBarColorModule`, which paints only on
Android 10–14, where the app is not edge-to-edge. Android 15+ always draws edge-to-edge, so the app
canvas shows behind the bar. On Android 8–9 the library draws a translucent scrim that matches the
button color; below Android 8 nothing changes.

## Testing

The app lists `expo-navigation-bar` itself so autolinking finds the native module. Tests that
render code calling this package should `jest.mock("@shared/system-bars")`.
