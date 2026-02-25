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
      { value: 0, expected: "extremeFear" },
      { value: 10, expected: "extremeFear" },
      { value: 25, expected: "extremeFear" },
      { value: 26, expected: "fear" },
      { value: 35, expected: "fear" },
      { value: 45, expected: "fear" },
      { value: 46, expected: "neutral" },
      { value: 50, expected: "neutral" },
      { value: 55, expected: "neutral" },
      { value: 56, expected: "greed" },
      { value: 70, expected: "greed" },
      { value: 75, expected: "greed" },
      { value: 76, expected: "extremeGreed" },
      { value: 90, expected: "extremeGreed" },
      { value: 100, expected: "extremeGreed" },
    ])("should return $expected for value $value", ({ value, expected }) => {
      expect(getFearAndGreedLevel(value)).toBe(expected);
    });
  });

  describe("getFearAndGreedTranslationKey", () => {
    it.each([
      { value: 10, expected: "fearAndGreed.levels.extremeFear" },
      { value: 35, expected: "fearAndGreed.levels.fear" },
      { value: 50, expected: "fearAndGreed.levels.neutral" },
      { value: 70, expected: "fearAndGreed.levels.greed" },
      { value: 90, expected: "fearAndGreed.levels.extremeGreed" },
    ])("should return $expected for value $value", ({ value, expected }) => {
      expect(getFearAndGreedTranslationKey(value)).toBe(expected);
    });
  });

  describe("getFearAndGreedColor", () => {
    it.each([
      { value: 10, level: "extremeFear", color: "error" },
      { value: 35, level: "fear", color: "warning" },
      { value: 50, level: "neutral", color: "muted" },
      { value: 70, level: "greed", color: "success" },
      { value: 90, level: "extremeGreed", color: "success" },
    ])("should return $color for value $value ($level)", ({ value, level, color }) => {
      expect(getFearAndGreedColorKey(value)).toBe(FEAR_AND_GREED_COLORS[level]);
      expect(getFearAndGreedColorKey(value)).toBe(color);
    });
  });

  describe("Constants", () => {
    describe("FEAR_AND_GREED_COLORS", () => {
      it.each([
        { level: "extremeFear", color: "error" },
        { level: "fear", color: "warning" },
        { level: "neutral", color: "muted" },
        { level: "greed", color: "success" },
        { level: "extremeGreed", color: "success" },
      ])("should have correct color for $level", ({ level, color }) => {
        expect(FEAR_AND_GREED_COLORS[level]).toBe(color);
      });
    });

    describe("FEAR_AND_GREED_TRANSLATION_KEYS", () => {
      it.each([
        { level: "extremeFear", key: "fearAndGreed.levels.extremeFear" },
        { level: "fear", key: "fearAndGreed.levels.fear" },
        { level: "neutral", key: "fearAndGreed.levels.neutral" },
        { level: "greed", key: "fearAndGreed.levels.greed" },
        { level: "extremeGreed", key: "fearAndGreed.levels.extremeGreed" },
      ])("should have correct key for $level", ({ level, key }) => {
        expect(FEAR_AND_GREED_TRANSLATION_KEYS[level]).toBe(key);
      });
    });
  });

  describe("Boundary values", () => {
    it.each([
      { value: 25, level: "extremeFear", color: "error" },
      { value: 45, level: "fear", color: "warning" },
      { value: 55, level: "neutral", color: "muted" },
      { value: 75, level: "greed", color: "success" },
    ])("should handle boundary at $value ($level)", ({ value, level, color }) => {
      expect(getFearAndGreedLevel(value)).toBe(level);
      expect(getFearAndGreedColorKey(value)).toBe(color);
    });
  });
});
