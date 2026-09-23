import { renderHook } from "tests/testSetup";
import { useSupportedLanguages } from "./useSupportedLanguages";
import { pushedLanguages } from "~/config/languages";

describe("useSupportedLanguages", () => {
  it("useSupportedLanguages should return every language including thai", async () => {
    const { result } = renderHook(() => useSupportedLanguages());

    expect(result.current.locales).toEqual([
      "en",
      "fr",
      "de",
      "ru",
      "es",
      "ja",
      "tr",
      "ko",
      "zh",
      "pt",
      "th",
    ]);
  });

  it("useSupportedLanguages shouldn't return en locale when passing pushedLanguages in params", async () => {
    const { result } = renderHook(() => useSupportedLanguages(pushedLanguages));

    expect(result.current.locales).toEqual([
      "fr",
      "de",
      "ru",
      "es",
      "ja",
      "tr",
      "ko",
      "zh",
      "pt",
      "th",
    ]);
  });
});
