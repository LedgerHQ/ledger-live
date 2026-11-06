import { resolveAnalyticsPositions } from "./resolveAnalyticsPositions";

const eth = { id: "eth" };
const token = { id: "eth+usdc" };

describe("resolveAnalyticsPositions", () => {
  it("should return the selected positions in the requested order", () => {
    expect(resolveAnalyticsPositions([token.id, eth.id], [eth, token])).toEqual([token, eth]);
  });

  it("should reject a selection that references a removed position", () => {
    expect(resolveAnalyticsPositions([eth.id, "removed"], [eth, token])).toBeUndefined();
  });
});
