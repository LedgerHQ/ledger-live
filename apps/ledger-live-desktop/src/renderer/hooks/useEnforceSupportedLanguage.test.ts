import { renderHook } from "tests/testSetup";
import { useEnforceSupportedLanguage } from "./useEnforceSupportedLanguage";
import { languageSelector } from "../reducers/settings";
import type { Language } from "~/config/languages";

describe("useEnforceSupportedLanguage", () => {
  it("useEnforceSupportedLanguage should keep language to th", async () => {
    const { store } = renderHook(() => useEnforceSupportedLanguage(), {
      initialState: {
        settings: {
          language: "th",
        },
      },
    });

    expect(languageSelector(store.getState())).toEqual("th");
  });

  it("useEnforceSupportedLanguage should set language to en if the persisted language is no longer supported", async () => {
    const { store } = renderHook(() => useEnforceSupportedLanguage(), {
      initialState: {
        settings: {
          language: "ar" as unknown as Language,
        },
      },
    });

    expect(languageSelector(store.getState())).toEqual("en");
  });
});
