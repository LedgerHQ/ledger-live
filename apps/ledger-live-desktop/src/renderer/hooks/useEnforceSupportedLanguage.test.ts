import { renderHook } from "tests/testUtils";
import { useEnforceSupportedLanguage } from "./useEnforceSupportedLanguage";
import { languageSelector } from "../reducers/settings";

describe("useEnforceSupportedLanguage", () => {
  it("useEnforceSupportedLanguage should keep language to th if thai is enabled", async () => {
    const { store } = renderHook(() => useEnforceSupportedLanguage(), {
      initialState: {
        settings: {
          language: "th",
          overriddenFeatureFlags: {
            lldThai: {
              enabled: true,
            },
          },
        },
      },
    });

    expect(languageSelector(store.getState())).toEqual("th");
  });

  it("useEnforceSupportedLanguage should set language to en if in th and thai is disabled", async () => {
    const { store } = renderHook(() => useEnforceSupportedLanguage(), {
      initialState: {
        settings: {
          language: "th",
          overriddenFeatureFlags: {
            lldThai: {
              enabled: false,
            },
          },
        },
      },
    });

    expect(languageSelector(store.getState())).toEqual("en");
  });
});
