import type { GeneralSideEffects } from "../ports";
import { applyGeneralSettingUpdate } from "./generalUpdate";

const SUPPORTED = {
  languages: [
    { value: "en", label: "English" },
    { value: "fr", label: "Français" },
  ],
  currencies: [
    { value: "EUR", label: "Euro" },
    { value: "USD", label: "US Dollar" },
  ],
};

function makeEffects() {
  return {
    setTheme: jest.fn(),
    setLanguage: jest.fn(),
    setCurrency: jest.fn(),
  } satisfies GeneralSideEffects;
}

describe("applyGeneralSettingUpdate", () => {
  it("stores the theme", () => {
    const effects = makeEffects();

    applyGeneralSettingUpdate(effects, { key: "theme", value: "system" }, SUPPORTED);

    expect(effects.setTheme).toHaveBeenCalledWith("system");
  });

  it("changes to a language the app lists", () => {
    const effects = makeEffects();

    applyGeneralSettingUpdate(effects, { key: "language", value: "fr" }, SUPPORTED);

    expect(effects.setLanguage).toHaveBeenCalledWith("fr");
  });

  it("ignores a language the app does not list", () => {
    const effects = makeEffects();

    applyGeneralSettingUpdate(effects, { key: "language", value: "xx" }, SUPPORTED);

    expect(effects.setLanguage).not.toHaveBeenCalled();
  });

  it("changes to a currency the app lists, and ignores another one", () => {
    const effects = makeEffects();

    applyGeneralSettingUpdate(effects, { key: "currency", value: "EUR" }, SUPPORTED);
    applyGeneralSettingUpdate(effects, { key: "currency", value: "XYZ" }, SUPPORTED);

    expect(effects.setCurrency.mock.calls).toEqual([["EUR"]]);
  });
});
