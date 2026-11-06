# @shared/system-bars

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Themes the Android system navigation bar (the bar with the back and home buttons) from React Native.
It wraps [`expo-navigation-bar`](https://docs.expo.dev/versions/latest/sdk/navigation-bar/), so
apps never import the library.

On iOS every call does nothing: iOS has no navigation bar.

## Exports

| Export                    | Description                                                               |
| ------------------------- | ------------------------------------------------------------------------- |
| `applyNavigationBarTheme` | `({ isDark }) => void` — picks button colors readable on the current theme |
| `NavigationBarTheme`      | Type of the argument above                                                |

## Usage

```ts
import { applyNavigationBarTheme } from "@shared/system-bars";

applyNavigationBarTheme({ isDark });
```

The native call is fire-and-forget: `expo-navigation-bar` does not return its Promise, so a native
failure cannot be caught here.

## Background color

`expo-navigation-bar` 57 (Expo SDK 57) has no background color API, so this package only sets the
button color. Android 15+ always draws edge-to-edge, so the app canvas shows behind the bar.
On Android 8–9 the library draws a translucent scrim that matches the button color; below Android 8
nothing changes. On Android 10–14 without edge-to-edge the bar keeps the color from the Android theme.

## Testing

The app lists `expo-navigation-bar` itself so autolinking finds the native module. Tests that
render code calling this package should `jest.mock("@shared/system-bars")`.
