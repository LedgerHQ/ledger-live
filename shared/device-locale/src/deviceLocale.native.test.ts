import { getCalendars, getLocales } from "expo-localization";
import {
  findBestAvailableLanguage,
  getDeviceLanguageTag,
  getDeviceRegion,
  getDeviceTimeZone,
} from "./deviceLocale";

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(),
  getCalendars: jest.fn(),
}));

const mockedGetLocales = jest.mocked(getLocales);
const mockedGetCalendars = jest.mocked(getCalendars);

type LocaleFields = {
  languageTag: string;
  languageCode?: string | null;
  languageScriptCode?: string | null;
  languageRegionCode?: string | null;
  regionCode?: string | null;
};

function givenLocales(...locales: LocaleFields[]) {
  mockedGetLocales.mockReturnValue(
    locales.map(locale => ({
      languageCode: null,
      languageScriptCode: null,
      languageRegionCode: null,
      regionCode: null,
      textDirection: "ltr",
      digitGroupingSeparator: ",",
      decimalSeparator: ".",
      measurementSystem: "metric",
      currencyCode: null,
      currencySymbol: null,
      languageCurrencyCode: null,
      languageCurrencySymbol: null,
      temperatureUnit: "celsius",
      ...locale,
    })),
  );
}

beforeEach(() => jest.clearAllMocks());

describe("getDeviceLanguageTag", () => {
  it("returns the first preferred language", () => {
    givenLocales({ languageTag: "fr-FR" }, { languageTag: "en-US" });

    expect(getDeviceLanguageTag()).toBe("fr-FR");
  });

  it("returns undefined when the device reports no language", () => {
    givenLocales();

    expect(getDeviceLanguageTag()).toBeUndefined();
  });
});

describe("getDeviceRegion", () => {
  it("returns the settings region, not the language's", () => {
    givenLocales({ languageTag: "en-US", languageRegionCode: "US", regionCode: "GB" });

    expect(getDeviceRegion()).toBe("GB");
  });

  it("returns undefined when the device has no region", () => {
    givenLocales({ languageTag: "en", regionCode: null });

    expect(getDeviceRegion()).toBeUndefined();
  });
});

describe("getDeviceTimeZone", () => {
  it("returns the time zone of the first calendar", () => {
    mockedGetCalendars.mockReturnValue([
      { calendar: null, timeZone: "Europe/Paris", uses24hourClock: true, firstWeekday: 2 },
    ]);

    expect(getDeviceTimeZone()).toBe("Europe/Paris");
  });

  it("returns undefined when the time zone is unknown", () => {
    mockedGetCalendars.mockReturnValue([
      { calendar: null, timeZone: null, uses24hourClock: null, firstWeekday: null },
    ]);

    expect(getDeviceTimeZone()).toBeUndefined();
  });
});

describe("findBestAvailableLanguage", () => {
  const supported = ["en", "fr", "zh-Hant", "pt-BR"] as const;

  it("matches a preferred language on its language code", () => {
    givenLocales({ languageTag: "fr-CA", languageCode: "fr", languageRegionCode: "CA" });

    expect(findBestAvailableLanguage(supported)).toBe("fr");
  });

  it("keeps the user's order over a closer match on a later language", () => {
    givenLocales(
      { languageTag: "fr-FR", languageCode: "fr", languageRegionCode: "FR" },
      { languageTag: "en", languageCode: "en" },
    );

    expect(findBestAvailableLanguage(["en", "fr-FR", "fr"])).toBe("fr-FR");
    expect(findBestAvailableLanguage(["en", "de"])).toBe("en");
  });

  it("matches on the script before the region", () => {
    givenLocales({
      languageTag: "zh-Hant-TW",
      languageCode: "zh",
      languageScriptCode: "Hant",
      languageRegionCode: "TW",
    });

    expect(findBestAvailableLanguage(supported)).toBe("zh-Hant");
  });

  it("matches on language and region when the full tag carries more", () => {
    givenLocales({
      languageTag: "pt-Latn-BR",
      languageCode: "pt",
      languageScriptCode: "Latn",
      languageRegionCode: "BR",
    });

    expect(findBestAvailableLanguage(supported)).toBe("pt-BR");
  });

  it("ignores case and returns the supported entry as written", () => {
    givenLocales({ languageTag: "PT-br", languageCode: "pt", languageRegionCode: "BR" });

    expect(findBestAvailableLanguage(supported)).toBe("pt-BR");
  });

  it("returns undefined when no preferred language is supported", () => {
    givenLocales({ languageTag: "de-DE", languageCode: "de", languageRegionCode: "DE" });

    expect(findBestAvailableLanguage(supported)).toBeUndefined();
  });
});
