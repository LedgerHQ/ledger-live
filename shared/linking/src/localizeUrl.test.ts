import { localizeUrl } from "./localizeUrl";
import type { LocalizationConfig } from "./types";

const baseConfig: LocalizationConfig = {
  currentLanguage: "en",
  defaultLanguage: "en",
  languages: {
    en: "",
    fr: "fr",
    es: "es",
    zh: "zh-hans",
  },
};

describe("localizeUrl", () => {
  it("returns the URL unchanged for the default language", () => {
    expect(localizeUrl("https://www.ledger.com/academy", baseConfig)).toBe(
      "https://www.ledger.com/academy",
    );
  });

  it("localizes ledger.com for French", () => {
    const config = { ...baseConfig, currentLanguage: "fr" };
    expect(localizeUrl("https://www.ledger.com/academy", config)).toBe(
      "https://www.ledger.com/fr/academy",
    );
  });

  it("localizes shop.ledger.com for Spanish", () => {
    const config = { ...baseConfig, currentLanguage: "es" };
    expect(localizeUrl("https://shop.ledger.com/pages/privacy-policy", config)).toBe(
      "https://shop.ledger.com/es/pages/privacy-policy",
    );
  });

  it("localizes support.ledger.com with zh-cn override", () => {
    const config = { ...baseConfig, currentLanguage: "zh" };
    expect(localizeUrl("https://support.ledger.com/article/123", config)).toBe(
      "https://support.ledger.com/zh-cn/article/123",
    );
  });

  it("returns non-matching URLs unchanged", () => {
    const config = { ...baseConfig, currentLanguage: "fr" };
    expect(localizeUrl("https://github.com/LedgerHQ", config)).toBe("https://github.com/LedgerHQ");
  });

  it("handles unknown language by returning the URL unchanged", () => {
    const config = { ...baseConfig, currentLanguage: "xx" };
    expect(localizeUrl("https://www.ledger.com/academy", config)).toBe(
      "https://www.ledger.com/academy",
    );
  });

  it("does not localize lookalike hosts", () => {
    const config = { ...baseConfig, currentLanguage: "fr" };
    expect(localizeUrl("https://www.ledger.com.evil/phishing", config)).toBe(
      "https://www.ledger.com.evil/phishing",
    );
  });

  it("does not localize subdomains of lookalike hosts", () => {
    const config = { ...baseConfig, currentLanguage: "fr" };
    expect(localizeUrl("https://shop.ledger.com.attacker.io/fake", config)).toBe(
      "https://shop.ledger.com.attacker.io/fake",
    );
  });

  it("localizes an exact domain match with no path", () => {
    const config = { ...baseConfig, currentLanguage: "fr" };
    expect(localizeUrl("https://www.ledger.com", config)).toBe("https://www.ledger.com/fr");
  });

  it("localizes a domain with query params", () => {
    const config = { ...baseConfig, currentLanguage: "fr" };
    expect(localizeUrl("https://www.ledger.com?ref=app", config)).toBe(
      "https://www.ledger.com/fr?ref=app",
    );
  });

  it("localizes support.ledger.com base without article suffix", () => {
    const config = { ...baseConfig, currentLanguage: "es" };
    expect(localizeUrl("https://support.ledger.com/faq", config)).toBe(
      "https://support.ledger.com/es/faq",
    );
  });
});
