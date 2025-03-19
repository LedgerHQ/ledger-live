import { getLocalizedUrl, useLocalizedUrl } from "./useLocalizedUrl";

const languages: Record<string, string> = {
  en: "",
  fr: "fr",
  es: "es",
  de: "de",
  ru: "ru",
  zh: "zh-hans",
  tr: "tr",
  pt: "pt-br",
  ja: "ja",
  ko: "ko",
  th: "",
};

const defaultLanguage = "en";

describe("getLocalizedUrl", () => {
  test('returns correct URL without language part for default language ("en")', () => {
    const url = getLocalizedUrl("https://www.ledger.com", languages, "en", defaultLanguage);
    expect(url).toBe("https://www.ledger.com");
  });

  test('returns correct URL with language part for non-default language ("fr")', () => {
    const url = getLocalizedUrl("https://www.ledger.com", languages, "fr", defaultLanguage);
    expect(url).toBe("https://www.ledger.com/fr");
  });

  test("handles suffix properly", () => {
    const url = getLocalizedUrl(
      "https://www.ledger.com",
      languages,
      "fr",
      defaultLanguage,
      "article/123",
    );
    expect(url).toBe("https://www.ledger.com/fr/article/123");
  });

  test("defaults to empty language part if language not in map", () => {
    const url = getLocalizedUrl("https://www.ledger.com", languages, "it", defaultLanguage);
    expect(url).toBe("https://www.ledger.com");
  });

  test('returns URL without language part for "th"', () => {
    const url = getLocalizedUrl("https://www.ledger.com", languages, "th", defaultLanguage);
    expect(url).toBe("https://www.ledger.com");
  });
});

describe("useLocalizedUrl", () => {
  const config = {
    currentLanguage: "fr",
    defaultLanguage: "en",
    languages: languages,
  };

  test('transforms URL for LEDGER with language part ("fr")', () => {
    const url = "https://www.ledger.com";
    const transformedUrl = useLocalizedUrl(url, config);
    expect(transformedUrl).toBe("https://www.ledger.com/fr");
  });

  test('transforms URL for SHOP with language part ("fr")', () => {
    const url = "https://shop.ledger.com";
    const transformedUrl = useLocalizedUrl(url, config);
    expect(transformedUrl).toBe("https://shop.ledger.com/fr");
  });

  test('transforms URL for BASE_LEDGER_SUPPORT with language part ("fr")', () => {
    const url = "https://support.ledger.com";
    const transformedUrl = useLocalizedUrl(url, config);
    expect(transformedUrl).toBe("https://support.ledger.com/fr");
  });

  test('transforms URL for SALESFORCE_SUPPORT with language part ("fr")', () => {
    const url = "https://support.ledger.com/article/123";
    const transformedUrl = useLocalizedUrl(url, config);
    expect(transformedUrl).toBe("https://support.ledger.com/fr/article/123");
  });

  test("does not transform URL if no matching pattern", () => {
    const url = "https://status.ledger.com";
    const transformedUrl = useLocalizedUrl(url, config);
    expect(transformedUrl).toBe(url);
  });

  test('returns correct URL with suffix when language is "fr"', () => {
    const url = "https://support.ledger.com/article/115005165269-zd";
    const transformedUrl = useLocalizedUrl(url, config);
    expect(transformedUrl).toBe("https://support.ledger.com/fr/article/115005165269-zd");
  });

  test('returns URL without language part for "th"', () => {
    const url = "https://www.ledger.com";
    const transformedUrl = useLocalizedUrl(url, { ...config, currentLanguage: "th" });
    expect(transformedUrl).toBe("https://www.ledger.com");
  });
});
