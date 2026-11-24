// expo-localization needs a native runtime; moduleNameMapper points every copy here so the
// real @shared/device-locale logic runs against a fixed en-US device in Paris.
const baseLocale = {
  languageScriptCode: null,
  textDirection: "ltr",
  digitGroupingSeparator: ",",
  decimalSeparator: ".",
  measurementSystem: "metric",
  currencySymbol: null,
  languageCurrencySymbol: null,
  temperatureUnit: "celsius",
};

export const getLocales = jest.fn(() => [
  {
    ...baseLocale,
    languageTag: "en-US",
    languageCode: "en",
    languageRegionCode: "US",
    regionCode: "US",
    currencyCode: "USD",
    languageCurrencyCode: "USD",
  },
  {
    ...baseLocale,
    languageTag: "fr-FR",
    languageCode: "fr",
    languageRegionCode: "FR",
    regionCode: "US",
    currencyCode: "USD",
    languageCurrencyCode: "EUR",
  },
]);

export const getCalendars = jest.fn(() => [
  { calendar: "gregory", timeZone: "Europe/Paris", uses24hourClock: true, firstWeekday: 2 },
]);
