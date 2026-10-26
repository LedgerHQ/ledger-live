# @shared/system-bars

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Themes the Android system navigation bar (the bar with the back and home buttons) from React Native.
It wraps [`expo-navigation-bar`](https://docs.expo.dev/versions/latest/sdk/navigation-bar/), so
apps never import the library.

On iOS every call does nothing: iOS has no navigation bar.

## Exports

| Export                    | Description                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `applyNavigationBarTheme` | `({ backgroundColor, isDark }) => Promise<void>` — paints the bar, picks readable button colors |
| `NavigationBarTheme`      | Type of the argument above                                                                    |

## Usage

```ts
import { applyNavigationBarTheme } from "@shared/system-bars";

applyNavigationBarTheme({ backgroundColor: theme.colors.bg.canvas, isDark }).catch(console.error);
```

## Edge-to-edge

With Android edge-to-edge (forced on Android 15+), the system ignores the background color and
only the button colors apply. `expo-navigation-bar` 57 (Expo SDK 57) drops the background color
API, so this package will only set the button colors after that upgrade.

## Testing

The app lists `expo-navigation-bar` itself so autolinking finds the native module. Tests that
render code calling this package should `jest.mock("@shared/system-bars")`.
