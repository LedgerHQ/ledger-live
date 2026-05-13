import { parseSwapTransactionStatusParams, sanitizeRedirectUrl } from "./parseParams";

describe("sanitizeRedirectUrl", () => {
  it("keeps https and internal deeplink urls", () => {
    expect(sanitizeRedirectUrl("https://ledger.com/swap")).toBe("https://ledger.com/swap");
    expect(sanitizeRedirectUrl("ledgerlive://swap/history")).toBe("ledgerlive://swap/history");
    expect(sanitizeRedirectUrl("ledgerwallet://open")).toBe("ledgerwallet://open");
  });

  it("drops unsafe or malformed urls", () => {
    expect(sanitizeRedirectUrl("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeRedirectUrl("/relative")).toBeUndefined();
    expect(sanitizeRedirectUrl("not a url")).toBeUndefined();
  });
});

describe("parseSwapTransactionStatusParams", () => {
  it("parses the minimal swap deeplink payload", () => {
    expect(
      parseSwapTransactionStatusParams({
        swapId: "swap-1",
        provider: "changelly_v2",
      }),
    ).toEqual({
      ok: true,
      params: {
        swapId: "swap-1",
        provider: "changelly_v2",
        redirectUrl: undefined,
      },
    });
  });

  it("allows provider to be omitted and trims optional public fields", () => {
    expect(
      parseSwapTransactionStatusParams({
        swapId: " swap-1 ",
        redirectUrl: " https://example.com/continue ",
      }),
    ).toEqual({
      ok: true,
      params: {
        swapId: "swap-1",
        provider: undefined,
        redirectUrl: "https://example.com/continue",
      },
    });
  });

  it("rejects missing required fields", () => {
    expect(parseSwapTransactionStatusParams({ provider: "lifi" })).toMatchObject({
      ok: false,
      error: { code: "missing_swap_id" },
    });
  });
});
