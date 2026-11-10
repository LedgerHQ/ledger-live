import { resolveAnalyticsPositions } from "./resolveAnalyticsPositions";
import { createAnalyticsAccount, createAnalyticsToken } from "../../analyticsSources.mock";

const eth = createAnalyticsAccount("analytics-resolve-eth");
const token = createAnalyticsToken(eth);
const positions = [eth, token];

describe("resolveAnalyticsPositions", () => {
  it("should return the selected positions in the requested order", () => {
    expect(resolveAnalyticsPositions([token.id, eth.id], positions)).toEqual([token, eth]);
  });

  it("should reject a selection that references a removed position", () => {
    expect(resolveAnalyticsPositions([eth.id, "removed"], positions)).toBeUndefined();
  });
});
