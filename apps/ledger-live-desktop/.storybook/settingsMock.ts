import { fn, Mock } from "@storybook/test";

const usdCurrency = {
  type: "FiatCurrency",
  id: "usd",
  name: "US Dollar",
  ticker: "USD",
  units: [
    {
      name: "US Dollar",
      code: "USD",
      magnitude: 2,
    },
  ],
};

export const settingsStoreSelector: Mock = fn(() => ({
  counterValue: "USD",
  countervalueFirst: false,
  discreetMode: false,
  developerMode: false,
  lastSeenCustomImage: null,
  deepLinkUrl: null,
  theme: "light",
  language: "en",
  lastUsedVersion: "0.0.0",
  preferredDeviceModelId: "stax",
  trackingEnabled: true,
  locale: "en",
  localeMode: "system",
  lastSeenDevice: null,
}));

export const counterValueCurrencyLocalSelector: Mock = fn(() => usdCurrency);
export const counterValueCurrencySelector: Mock = fn(() => usdCurrency);
export const countervalueFirstSelector: Mock = fn(() => false);
export const discreetModeSelector: Mock = fn(() => false);
export const developerModeSelector: Mock = fn(() => false);
export const lastUsedVersionSelector: Mock = fn(() => "0.0.0");
export const userThemeSelector: Mock = fn(() => "light");
export const languageSelector: Mock = fn(() => "en");
export const localeSelector: Mock = fn(() => "en");
export const lastSeenCustomImageSelector: Mock = fn(() => null);
export const deepLinkUrlSelector: Mock = fn(() => null);
export const preferredDeviceModelSelector: Mock = fn(() => "stax");
export const trackingEnabledSelector: Mock = fn(() => true);
export const lastSeenDeviceSelector: Mock = fn(() => null);
export const currencySettingsLocaleSelector: Mock = fn((_, currency) => ({
  unit: currency?.units?.[0] ?? {
    name: "Unit",
    code: currency?.ticker ?? "UNIT",
    magnitude: 0,
  },
}));
