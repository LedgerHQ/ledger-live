import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { getTimeAgoCode } from ".";
import en from "~/locales/en/common.json";

beforeAll(async () => {
  await i18next.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: {
        translation: en,
      },
    },
  });
});

describe("getTimeAgoCode", () => {
  it("returns the translated string for seconds (plural)", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 10 * 1000);

    const result = getTimeAgoCode(past);

    expect(result).toBe("(10 seconds ago)");
  });

  it("returns the translated string for minutes (plural)", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 5 * 60 * 1000);

    const result = getTimeAgoCode(past);

    expect(result).toBe("(5 minutes ago)");
  });

  it("returns the translated string for hours (singular)", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 1 * 60 * 60 * 1000);

    const result = getTimeAgoCode(past);

    expect(result).toBe("(1 hour ago)");
  });

  it("returns the translated string for days (plural)", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const result = getTimeAgoCode(past);

    expect(result).toBe("(3 days ago)");
  });

  it("returns the translated string for months (plural)", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000);

    const result = getTimeAgoCode(past);

    expect(result).toBe("(3 months ago)");
  });

  it("returns the translated string for years (plural)", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);

    const result = getTimeAgoCode(past);

    expect(result).toBe("(2 years ago)");
  });
});
