import { renderHook } from "tests/testSetup";
import { useEnforceSupportedLanguage } from "./useEnforceSupportedLanguage";
import { languageSelector } from "../reducers/settings";

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

  it("useEnforceSupportedLanguage should set language to en if the language is not supported", async () => {
    const { store } = renderHook(() => useEnforceSupportedLanguage(), {
      initialState: {
        settings: {
          language: "xx",
        },
      },
    });

    expect(languageSelector(store.getState())).toEqual("en");
  });
});
