import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useEnforceSupportedLanguage } from "./useEnforceSupportedLanguage";
import { languageSelector } from "../reducers/settings";

describe("useEnforceSupportedLanguage", () => {
  it("useEnforceSupportedLanguage should keep language to th if thai is enabled", async () => {
    const { store } = renderHook(() => useEnforceSupportedLanguage(), {
      initialState: {
        ...withFlagOverrides({ lldThai: { enabled: true } }),
        settings: {
          language: "th",
        },
      },
    });

    expect(languageSelector(store.getState())).toEqual("th");
  });

  it("useEnforceSupportedLanguage should set language to en if in th and thai is disabled", async () => {
    const { store } = renderHook(() => useEnforceSupportedLanguage(), {
      initialState: {
        ...withFlagOverrides({ lldThai: { enabled: false } }),
        settings: {
          language: "th",
        },
      },
    });

    expect(languageSelector(store.getState())).toEqual("en");
  });
});
