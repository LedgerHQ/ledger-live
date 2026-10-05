import {
  getActiveWarningsTrackingProperties,
  getSendFlowBlockchain,
  getSendFlowCurrencyId,
  getSendFlowCurrencyTicker,
  getSendFlowErrorTrackingProperties,
  getSendFlowTrackingProperties,
} from "../tracking";

describe("send flow tracking", () => {
  it("uses the account currency id for account blockchain", () => {
    expect(getSendFlowBlockchain({ type: "Account", currency: { id: "bitcoin" } })).toBe("bitcoin");
  });

  it("uses the parent account currency id for token account blockchain", () => {
    expect(
      getSendFlowBlockchain(
        { type: "TokenAccount", token: { parentCurrencyId: "polygon" } },
        { currency: { id: "ethereum" } },
      ),
    ).toBe("ethereum");
  });

  it("falls back to the token parent currency when parent account is missing", () => {
    expect(
      getSendFlowBlockchain({
        type: "TokenAccount",
        token: { parentCurrencyId: "polygon" },
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
        token: {
          id: "ethereum/erc20/usd_tether__erc20_",
          parentCurrencyId: "ethereum",
        },
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
          parentCurrencyId: "ethereum",
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
            parentCurrencyId: "ethereum",
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

  it("includes source when provided", () => {
    expect(
      getSendFlowTrackingProperties(
        { type: "Account", currency: { id: "bitcoin" } },
        null,
        true,
        "pay",
      ),
    ).toEqual({
      flow: "send",
      blockchain: "bitcoin",
      currency: "",
      currency_id: "bitcoin",
      newSendFlow: true,
      source: "pay",
    });
  });

  it("omits source entirely when not provided", () => {
    const result = getSendFlowTrackingProperties({ type: "Account", currency: { id: "bitcoin" } });
    expect(result).not.toHaveProperty("source");
  });

  it("builds a sanitised error payload", () => {
    const properties = getSendFlowErrorTrackingProperties({
      account: null,
      flowSessionId: "flow-id",
      step: "AMOUNT",
      message: {
        messageId: "NotEnoughGas",
        messageType: "error",
        suppressedErrors: ["FeeTooHigh"],
      },
      metadata: {
        recipientType: "address",
        recipientLength: 42,
        memoLength: 8,
        memoType: "memo",
        amountRatioToBalance: 0.5,
      },
    });

    expect(properties).toMatchObject({
      flow_session_id: "flow-id",
      step: "AMOUNT",
      message_id: "NotEnoughGas",
      message_type: "error",
      suppressed_errors: ["FeeTooHigh"],
      recipient_type: "address",
      recipient_length: 42,
      memo_length: 8,
      memo_type: "memo",
      amount_ratio_to_balance: 0.5,
    });
    expect(properties).not.toHaveProperty("address");
    expect(properties).not.toHaveProperty("memo");
    expect(properties).not.toHaveProperty("amount");
    expect(properties).not.toHaveProperty("device_serial");
  });

  it("always returns the active warnings array and count", () => {
    expect(getActiveWarningsTrackingProperties([])).toEqual({
      active_warnings: [],
      active_warnings_count: 0,
    });
    expect(getActiveWarningsTrackingProperties(["FeeTooHigh"])).toEqual({
      active_warnings: ["FeeTooHigh"],
      active_warnings_count: 1,
    });
  });
});
