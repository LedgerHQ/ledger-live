import { FearAndGreedIndexSchema } from "./schema";

describe("FearAndGreedIndexSchema", () => {
  it("validates a well-formed index", () => {
    expect(FearAndGreedIndexSchema.parse({ value: 49, classification: "Neutral" })).toEqual({
      value: 49,
      classification: "Neutral",
    });
  });

  it("accepts boundary values", () => {
    expect(() =>
      FearAndGreedIndexSchema.parse({ value: 0, classification: "Extreme Fear" }),
    ).not.toThrow();
    expect(() =>
      FearAndGreedIndexSchema.parse({ value: 100, classification: "Extreme Greed" }),
    ).not.toThrow();
  });

  it("throws when value is out of range", () => {
    expect(() => FearAndGreedIndexSchema.parse({ value: 101, classification: "Greed" })).toThrow();
    expect(() => FearAndGreedIndexSchema.parse({ value: -1, classification: "Fear" })).toThrow();
  });

  it("throws when classification is missing", () => {
    expect(() => FearAndGreedIndexSchema.parse({ value: 50 })).toThrow();
  });
});
