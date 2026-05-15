import {
  getSendFlowBlockchain,
  getSendFlowCurrencyId,
  getSendFlowCurrencyTicker,
  getSendFlowTrackingProperties,
} from "../tracking";

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

  it("uses the account currency id as currency_id for Account", () => {
    expect(getSendFlowCurrencyId({ type: "Account", currency: { id: "bitcoin" } })).toBe("bitcoin");
  });

  it("uses the token id as currency_id for TokenAccount", () => {
    expect(
      getSendFlowCurrencyId({
        type: "TokenAccount",
        token: { id: "ethereum/erc20/usd_tether__erc20_", parentCurrency: { id: "ethereum" } },
      }),
    ).toBe("ethereum/erc20/usd_tether__erc20_");
  });

  it("uses the account currency ticker for Account", () => {
    expect(
      getSendFlowCurrencyTicker({
        type: "Account",
        currency: { id: "bitcoin", ticker: "BTC" },
      }),
    ).toBe("BTC");
  });

  it("uses the token ticker for TokenAccount", () => {
    expect(
      getSendFlowCurrencyTicker({
        type: "TokenAccount",
        token: {
          id: "ethereum/erc20/usd_tether__erc20_",
          ticker: "USDT",
          parentCurrency: { id: "ethereum" },
        },
      }),
    ).toBe("USDT");
  });

  it("returns send flow tracking properties", () => {
    expect(getSendFlowTrackingProperties(null)).toEqual({
      flow: "send",
      blockchain: "",
      currency: "",
      currency_id: "",
      newSendFlow: true,
    });
  });

  it("returns send flow tracking properties for the old flow", () => {
    expect(getSendFlowTrackingProperties(null, null, false)).toEqual({
      flow: "send",
      blockchain: "",
      currency: "",
      currency_id: "",
      newSendFlow: false,
    });
  });

  it("returns send flow tracking properties with currency_id and ticker for TokenAccount", () => {
    expect(
      getSendFlowTrackingProperties(
        {
          type: "TokenAccount",
          token: {
            id: "ethereum/erc20/usd_tether__erc20_",
            ticker: "USDT",
            parentCurrency: { id: "ethereum" },
          },
        },
        { currency: { id: "ethereum" } },
      ),
    ).toEqual({
      flow: "send",
      blockchain: "ethereum",
      currency: "USDT",
      currency_id: "ethereum/erc20/usd_tether__erc20_",
      newSendFlow: true,
    });
  });
});
