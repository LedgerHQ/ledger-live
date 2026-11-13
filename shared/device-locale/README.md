# @shared/device-locale

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Reads the device language, region and time zone from React Native. It wraps
[`expo-localization`](https://docs.expo.dev/versions/latest/sdk/localization/), so apps never
import the library.

## Exports

| Export                      | Description                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `getDeviceLanguageTag`      | `() => string \| undefined` — first preferred language (`fr-FR`)                               |
| `getDeviceRegion`           | `() => string \| undefined` — region from the device settings (`GB`), not the language's       |
| `getDeviceTimeZone`         | `() => string \| undefined` — IANA time zone (`Europe/Paris`)                                  |
| `findBestAvailableLanguage` | `(supported) => T \| undefined` — best entry of `supported` for the user's preferred languages |

`findBestAvailableLanguage` keeps the algorithm of `react-native-localize` 2.2.6, which this
package replaces: for each preferred language, in the user's order, it tries the full tag,
language-script, language-region, then the language alone, ignoring case.

## Usage

```ts
import { findBestAvailableLanguage } from "@shared/device-locale";

const language = findBestAvailableLanguage(["en", "fr", "de"]) ?? "en";
```

## Testing

The app lists `expo-localization` itself so autolinking finds the native module. Its jest config
maps `expo-localization` to a stub (`__mocks__/expo-localization.ts`), so tests run this package
against a fixed en-US device.
