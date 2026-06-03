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
      { value: 0, expected: "fearPlus" },
      { value: 10, expected: "fearPlus" },
      { value: 19, expected: "fearPlus" },
      { value: 26, expected: "fear" },
      { value: 35, expected: "fear" },
      { value: 40, expected: "fear" },
      { value: 46, expected: "neutral" },
      { value: 50, expected: "neutral" },
      { value: 55, expected: "neutral" },
      { value: 61, expected: "greed" },
      { value: 70, expected: "greed" },
      { value: 75, expected: "greed" },
      { value: 81, expected: "greedPlus" },
      { value: 90, expected: "greedPlus" },
      { value: 100, expected: "greedPlus" },
    ])("should return $expected for value $value", ({ value, expected }) => {
      expect(getFearAndGreedLevel(value)).toBe(expected);
    });
  });

  describe("getFearAndGreedTranslationKey", () => {
    it.each([
      { value: 10, expected: "fearAndGreed.levels.fearPlus" },
      { value: 35, expected: "fearAndGreed.levels.fear" },
      { value: 50, expected: "fearAndGreed.levels.neutral" },
      { value: 70, expected: "fearAndGreed.levels.greed" },
      { value: 90, expected: "fearAndGreed.levels.greedPlus" },
    ])("should return $expected for value $value", ({ value, expected }) => {
      expect(getFearAndGreedTranslationKey(value)).toBe(expected);
    });
  });

  describe("getFearAndGreedColor", () => {
    it.each([
      { value: 10, level: "fearPlus", color: "error" },
      { value: 35, level: "fear", color: "warning" },
      { value: 50, level: "neutral", color: "muted" },
      { value: 70, level: "greed", color: "success" },
      { value: 90, level: "greedPlus", color: "success" },
    ])("should return $color for value $value ($level)", ({ value, level, color }) => {
      expect(getFearAndGreedColorKey(value)).toBe(FEAR_AND_GREED_COLORS[level]);
      expect(getFearAndGreedColorKey(value)).toBe(color);
    });
  });

  describe("Constants", () => {
    describe("FEAR_AND_GREED_COLORS", () => {
      it.each([
        { level: "fearPlus", color: "error" },
        { level: "fear", color: "warning" },
        { level: "neutral", color: "muted" },
        { level: "greed", color: "success" },
        { level: "greedPlus", color: "success" },
      ])("should have correct color for $level", ({ level, color }) => {
        expect(FEAR_AND_GREED_COLORS[level]).toBe(color);
      });
    });

    describe("FEAR_AND_GREED_TRANSLATION_KEYS", () => {
      it.each([
        { level: "fearPlus", key: "fearAndGreed.levels.fearPlus" },
        { level: "fear", key: "fearAndGreed.levels.fear" },
        { level: "neutral", key: "fearAndGreed.levels.neutral" },
        { level: "greed", key: "fearAndGreed.levels.greed" },
        { level: "greedPlus", key: "fearAndGreed.levels.greedPlus" },
      ])("should have correct key for $level", ({ level, key }) => {
        expect(FEAR_AND_GREED_TRANSLATION_KEYS[level]).toBe(key);
      });
    });
  });

  describe("Boundary values", () => {
    it.each([
      { value: 20, level: "fearPlus", color: "error" },
      { value: 40, level: "fear", color: "warning" },
      { value: 60, level: "neutral", color: "muted" },
      { value: 80, level: "greed", color: "success" },
    ])("should handle boundary at $value ($level)", ({ value, level, color }) => {
      expect(getFearAndGreedLevel(value)).toBe(level);
      expect(getFearAndGreedColorKey(value)).toBe(color);
    });
  });
});
