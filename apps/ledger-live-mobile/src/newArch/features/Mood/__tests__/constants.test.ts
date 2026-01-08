import {
  getMoodLevel,
  getMoodLabel,
  getMoodColor,
  MOOD_COLORS,
  MOOD_LABELS,
} from "../utils/constants";

describe("Mood utils", () => {
  describe("getMoodLevel", () => {
    it("should return extremeFear for value <= 25", () => {
      expect(getMoodLevel(0)).toBe("extremeFear");
      expect(getMoodLevel(10)).toBe("extremeFear");
      expect(getMoodLevel(25)).toBe("extremeFear");
    });

    it("should return fear for value 26-45", () => {
      expect(getMoodLevel(26)).toBe("fear");
      expect(getMoodLevel(35)).toBe("fear");
      expect(getMoodLevel(45)).toBe("fear");
    });

    it("should return neutral for value 46-55", () => {
      expect(getMoodLevel(46)).toBe("neutral");
      expect(getMoodLevel(50)).toBe("neutral");
      expect(getMoodLevel(55)).toBe("neutral");
    });

    it("should return greed for value 56-75", () => {
      expect(getMoodLevel(56)).toBe("greed");
      expect(getMoodLevel(70)).toBe("greed");
      expect(getMoodLevel(75)).toBe("greed");
    });

    it("should return extremeGreed for value > 75", () => {
      expect(getMoodLevel(76)).toBe("extremeGreed");
      expect(getMoodLevel(90)).toBe("extremeGreed");
      expect(getMoodLevel(100)).toBe("extremeGreed");
    });
  });

  describe("getMoodLabel", () => {
    it("should return correct label for each mood level", () => {
      expect(getMoodLabel(10)).toBe("Extreme Fear");
      expect(getMoodLabel(35)).toBe("Fear");
      expect(getMoodLabel(50)).toBe("Neutral");
      expect(getMoodLabel(70)).toBe("Greed");
      expect(getMoodLabel(90)).toBe("Extreme Greed");
    });
  });

  describe("getMoodColor", () => {
    it("should return red color for extreme fear", () => {
      expect(getMoodColor(10)).toBe(MOOD_COLORS.extremeFear);
      expect(getMoodColor(10)).toBe("#C24244");
    });

    it("should return orange color for fear", () => {
      expect(getMoodColor(35)).toBe(MOOD_COLORS.fear);
      expect(getMoodColor(35)).toBe("#D38B20");
    });

    it("should return grey color for neutral", () => {
      expect(getMoodColor(50)).toBe(MOOD_COLORS.neutral);
      expect(getMoodColor(50)).toBe("#767676");
    });

    it("should return green color for greed", () => {
      expect(getMoodColor(70)).toBe(MOOD_COLORS.greed);
      expect(getMoodColor(70)).toBe("#47883A");
    });

    it("should return green color for extreme greed", () => {
      expect(getMoodColor(90)).toBe(MOOD_COLORS.extremeGreed);
      expect(getMoodColor(90)).toBe("#47883A");
    });
  });

  describe("MOOD_COLORS constants", () => {
    it("should have correct color values", () => {
      expect(MOOD_COLORS.extremeFear).toBe("#C24244");
      expect(MOOD_COLORS.fear).toBe("#D38B20");
      expect(MOOD_COLORS.neutral).toBe("#767676");
      expect(MOOD_COLORS.greed).toBe("#47883A");
      expect(MOOD_COLORS.extremeGreed).toBe("#47883A");
    });
  });

  describe("MOOD_LABELS constants", () => {
    it("should have correct label values", () => {
      expect(MOOD_LABELS.extremeFear).toBe("Extreme Fear");
      expect(MOOD_LABELS.fear).toBe("Fear");
      expect(MOOD_LABELS.neutral).toBe("Neutral");
      expect(MOOD_LABELS.greed).toBe("Greed");
      expect(MOOD_LABELS.extremeGreed).toBe("Extreme Greed");
    });
  });

  describe("boundary values", () => {
    it("should handle exact boundary at 25", () => {
      expect(getMoodLevel(25)).toBe("extremeFear");
      expect(getMoodColor(25)).toBe("#C24244");
    });

    it("should handle exact boundary at 45", () => {
      expect(getMoodLevel(45)).toBe("fear");
      expect(getMoodColor(45)).toBe("#D38B20");
    });

    it("should handle exact boundary at 55", () => {
      expect(getMoodLevel(55)).toBe("neutral");
      expect(getMoodColor(55)).toBe("#767676");
    });

    it("should handle exact boundary at 75", () => {
      expect(getMoodLevel(75)).toBe("greed");
      expect(getMoodColor(75)).toBe("#47883A");
    });
  });
});
