import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useSupportedLanguages } from "./useSupportedLanguages";
import { pushedLanguages } from "~/config/languages";

describe("useSupportedLocales", () => {
  it("useSupportedLocales shouldn't return thai locale when lldThai FF is off", async () => {
    const { result } = renderHook(() => useSupportedLanguages(), {
      initialState: withFlagOverrides({ lldThai: { enabled: false } }),
    });

    expect(result.current.locales).toEqual([
      "en",
      "fr",
      "de",
      "ru",
      "ro",
      "es",
      "ja",
      "tr",
      "ko",
      "zh",
      "pt",
    ]);
  });

  it("useSupportedLocales should return thai locale when lldThai FF is on", async () => {
    const { result } = renderHook(() => useSupportedLanguages(), {
      initialState: withFlagOverrides({ lldThai: { enabled: true } }),
    });

    expect(result.current.locales).toEqual([
      "en",
      "fr",
      "de",
      "ru",
      "ro",
      "es",
      "ja",
      "tr",
      "ko",
      "zh",
      "pt",
      "th",
    ]);
  });

  it("useSupportedLocales shouldn't return en locale when passing pushedLanguages in params", async () => {
    const { result } = renderHook(() => useSupportedLanguages(pushedLanguages), {
      initialState: withFlagOverrides({ lldThai: { enabled: false } }),
    });

    expect(result.current.locales).toEqual(["fr", "de", "ru", "ro", "es", "ja", "tr", "ko", "zh", "pt"]);
  });
});
