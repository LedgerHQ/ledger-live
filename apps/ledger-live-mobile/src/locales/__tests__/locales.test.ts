import { createInstance } from "i18next";
import { en, fr } from "..";

function readLanguages(locales: Record<string, object>): string[] {
  return Object.keys(locales).filter(
    language => Object.getOwnPropertyDescriptor(locales[language], "common")?.value !== undefined,
  );
}

describe("locales", () => {
  it("should read only the English catalog when the app's i18n instance starts", () => {
    jest.isolateModules(() => {
      const locales: typeof import("..") = require("..");
      expect(readLanguages(locales)).toEqual([]);

      require("~/i18n/instance");

      expect(readLanguages(locales)).toEqual(["en"]);
    });
  });

  it("should read a language's catalog only when the app switches to it", async () => {
    await jest.isolateModulesAsync(async () => {
      const locales: typeof import("..") = require("..");
      const { default: i18n }: typeof import("~/i18n/instance") = require("~/i18n/instance");

      await i18n.changeLanguage("fr");

      expect(i18n.t("common.cancel")).toBe("Annuler");
      expect(readLanguages(locales)).toEqual(["en", "fr"]);
    });
  });

  it("should translate in the active language through i18next", () => {
    const i18n = createInstance();
    i18n.init({
      lng: "fr",
      fallbackLng: "en",
      resources: { en, fr },
      ns: ["common"],
      defaultNS: "common",
    });

    expect(i18n.t("common.cancel")).toBe("Annuler");
    expect(i18n.t("common.cancel", { lng: "en" })).toBe("Cancel");
  });

  it("should keep the catalog read first, and let it be replaced like a plain value", () => {
    const catalog = en.common;

    expect(en.common).toBe(catalog);

    const replacement = { common: { cancel: "Dismiss" } };
    en.common = replacement;

    expect(en.common).toBe(replacement);
    en.common = catalog;
  });
});
