import { resolveSelection } from "../logic/resolveSelection";
import { USDC_ID, USDT_ID } from "./fixtures";

describe("resolveSelection", () => {
  it("should keep 'all' as-is", () => {
    expect(resolveSelection("all", [USDC_ID, USDT_ID])).toBe("all");
  });

  it("should keep the persisted filter when it is still a listed option", () => {
    expect(resolveSelection(USDC_ID, ["all", USDC_ID, USDT_ID])).toBe(USDC_ID);
  });

  it("should fall back to 'all' when the persisted filter is no longer listed", () => {
    expect(resolveSelection(USDC_ID, ["all", USDT_ID])).toBe("all");
  });

  it("should fall back to 'all' when there are no options", () => {
    expect(resolveSelection(USDC_ID, [])).toBe("all");
  });
});
