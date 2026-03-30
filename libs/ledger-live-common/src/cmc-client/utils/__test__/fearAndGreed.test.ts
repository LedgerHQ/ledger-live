import {
  getFearAndGreedLevel,
  getFearAndGreedTranslationKey,
  getFearAndGreedColorKey,
  FEAR_AND_GREED_COLORS,
  FEAR_AND_GREED_TRANSLATION_KEYS,
} from "../fearAndGreed";

describe("Fear and Greed utils", () => {
  describe("getFearAndGreedLevel", () => {
    it.each([
      { value: 0, expected: "fear" },
      { value: 10, expected: "fear" },
      { value: 19, expected: "fear" },
      { value: 26, expected: "cautious" },
      { value: 35, expected: "cautious" },
      { value: 40, expected: "cautious" },
      { value: 46, expected: "neutral" },
      { value: 50, expected: "neutral" },
      { value: 55, expected: "neutral" },
      { value: 61, expected: "optimistic" },
      { value: 70, expected: "optimistic" },
      { value: 75, expected: "optimistic" },
      { value: 81, expected: "greedy" },
      { value: 90, expected: "greedy" },
      { value: 100, expected: "greedy" },
    ])("should return $expected for value $value", ({ value, expected }) => {
      expect(getFearAndGreedLevel(value)).toBe(expected);
    });
  });

  describe("getFearAndGreedTranslationKey", () => {
    it.each([
      { value: 10, expected: "fearAndGreed.levels.fear" },
      { value: 35, expected: "fearAndGreed.levels.cautious" },
      { value: 50, expected: "fearAndGreed.levels.neutral" },
      { value: 70, expected: "fearAndGreed.levels.optimistic" },
      { value: 90, expected: "fearAndGreed.levels.greedy" },
    ])("should return $expected for value $value", ({ value, expected }) => {
      expect(getFearAndGreedTranslationKey(value)).toBe(expected);
    });
  });

  describe("getFearAndGreedColor", () => {
    it.each([
      { value: 10, level: "fear", color: "error" },
      { value: 35, level: "cautious", color: "warning" },
      { value: 50, level: "neutral", color: "muted" },
      { value: 70, level: "optimistic", color: "success" },
      { value: 90, level: "greedy", color: "success" },
    ])("should return $color for value $value ($level)", ({ value, level, color }) => {
      expect(getFearAndGreedColorKey(value)).toBe(FEAR_AND_GREED_COLORS[level]);
      expect(getFearAndGreedColorKey(value)).toBe(color);
    });
  });

  describe("Constants", () => {
    describe("FEAR_AND_GREED_COLORS", () => {
      it.each([
        { level: "fear", color: "error" },
        { level: "cautious", color: "warning" },
        { level: "neutral", color: "muted" },
        { level: "optimistic", color: "success" },
        { level: "greedy", color: "success" },
      ])("should have correct color for $level", ({ level, color }) => {
        expect(FEAR_AND_GREED_COLORS[level]).toBe(color);
      });
    });

    describe("FEAR_AND_GREED_TRANSLATION_KEYS", () => {
      it.each([
        { level: "fear", key: "fearAndGreed.levels.fear" },
        { level: "cautious", key: "fearAndGreed.levels.cautious" },
        { level: "neutral", key: "fearAndGreed.levels.neutral" },
        { level: "optimistic", key: "fearAndGreed.levels.optimistic" },
        { level: "greedy", key: "fearAndGreed.levels.greedy" },
      ])("should have correct key for $level", ({ level, key }) => {
        expect(FEAR_AND_GREED_TRANSLATION_KEYS[level]).toBe(key);
      });
    });
  });

  describe("Boundary values", () => {
    it.each([
      { value: 20, level: "fear", color: "error" },
      { value: 40, level: "cautious", color: "warning" },
      { value: 60, level: "neutral", color: "muted" },
      { value: 80, level: "optimistic", color: "success" },
    ])("should handle boundary at $value ($level)", ({ value, level, color }) => {
      expect(getFearAndGreedLevel(value)).toBe(level);
      expect(getFearAndGreedColorKey(value)).toBe(color);
    });
  });
});
