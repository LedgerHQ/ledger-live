import { createInstance } from "i18next";
import { en, fr } from "..";

describe("locales", () => {
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
