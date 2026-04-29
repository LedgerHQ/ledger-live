import { getSendFlowBlockchain, getSendFlowTrackingProperties } from "../tracking";

describe("send flow tracking", () => {
  it("uses the account currency id for account blockchain", () => {
    expect(getSendFlowBlockchain({ type: "Account", currency: { id: "bitcoin" } })).toBe("bitcoin");
  });

  it("uses the parent account currency id for token account blockchain", () => {
    expect(
      getSendFlowBlockchain(
        { type: "TokenAccount", token: { parentCurrency: { id: "polygon" } } },
        { currency: { id: "ethereum" } },
      ),
    ).toBe("ethereum");
  });

  it("falls back to the token parent currency when parent account is missing", () => {
    expect(
      getSendFlowBlockchain({
        type: "TokenAccount",
        token: { parentCurrency: { id: "polygon" } },
      }),
    ).toBe("polygon");
  });

  it("returns send flow tracking properties", () => {
    expect(getSendFlowTrackingProperties(null)).toEqual({
      flow: "send",
      blockchain: "",
    });
  });
});
