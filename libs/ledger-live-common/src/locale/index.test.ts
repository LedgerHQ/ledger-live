import { getCountryCodeFromLocale } from "./index";

describe("getCountryCodeFromLocale", () => {
  it("should extract country code from standard locale strings", () => {
    expect(getCountryCodeFromLocale("fr-FR")).toBe("fr");
    expect(getCountryCodeFromLocale("en-US")).toBe("us");
    expect(getCountryCodeFromLocale("de-DE")).toBe("de");
    expect(getCountryCodeFromLocale("es-ES")).toBe("es");
    expect(getCountryCodeFromLocale("pt-BR")).toBe("br");
  });

  it("should handle uppercase country codes by lowercasing them", () => {
    expect(getCountryCodeFromLocale("en-US")).toBe("us");
    expect(getCountryCodeFromLocale("fr-FR")).toBe("fr");
  });

  it("should return undefined for language-only locale strings", () => {
    expect(getCountryCodeFromLocale("en")).toBeUndefined();
    expect(getCountryCodeFromLocale("fr")).toBeUndefined();
    expect(getCountryCodeFromLocale("de")).toBeUndefined();
  });

  it("should handle empty string", () => {
    expect(getCountryCodeFromLocale("")).toBeUndefined();
  });
});
