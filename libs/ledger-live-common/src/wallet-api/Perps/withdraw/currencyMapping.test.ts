import { toLedgerCurrencyId, toSwapKitCurrencyId } from "./currencyMapping";

describe("withdraw currency mapping", () => {
  it("maps a SwapKit currency id to the Ledger Wallet currency id", () => {
    expect(toLedgerCurrencyId("ethereum")).toBe("ethereum");
  });

  it("maps a Ledger Wallet currency id to the SwapKit currency id", () => {
    expect(toSwapKitCurrencyId("ethereum")).toBe("ethereum");
  });

  it("round-trips a currency id", () => {
    expect(toLedgerCurrencyId(toSwapKitCurrencyId("arbitrum/erc20/usd_coin"))).toBe(
      "arbitrum/erc20/usd_coin",
    );
  });
});
