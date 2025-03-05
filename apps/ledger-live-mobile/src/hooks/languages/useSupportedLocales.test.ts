import { renderHook } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { useSupportedLocales } from "./useSupportedLocales";

describe("useSupportedLocales", () => {
  it("useSupportedLocales shouldn't return thai locale when llmThai FF is off", async () => {
    const { result } = renderHook(() => useSupportedLocales(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          overriddenFeatureFlags: {
            llmThai: {
              enabled: false,
            },
          },
        },
      }),
    });

    expect(result.current).toEqual(["en", "fr", "es", "ru", "zh", "de", "tr", "ja", "ko", "pt"]);
  });

  it("useSupportedLocales should return thai locale when llmThai FF is on", async () => {
    const { result } = renderHook(() => useSupportedLocales(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          overriddenFeatureFlags: {
            llmThai: {
              enabled: true,
            },
          },
        },
      }),
    });

    expect(result.current).toEqual([
      "en",
      "fr",
      "es",
      "ru",
      "zh",
      "de",
      "tr",
      "ja",
      "ko",
      "pt",
      "th",
    ]);
  });
});
