import { transformFearAndGreedResponse } from "./transforms";
import { mockFearAndGreedLatest } from "./fearAndGreed.mock";

describe("transformFearAndGreedResponse", () => {
  it("maps the raw CMC response to the canonical index", () => {
    expect(transformFearAndGreedResponse(mockFearAndGreedLatest)).toEqual({
      value: 49,
      classification: "Neutral",
    });
  });

  it("throws on an invalid payload", () => {
    expect(() => transformFearAndGreedResponse({ data: { value: 49 } })).toThrow();
    expect(() => transformFearAndGreedResponse(null)).toThrow();
  });
});
