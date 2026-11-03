import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { WithdrawQuote } from "./quote";
import { getPerpsWithdrawSummary } from "./summary";

const sourceAccount = genAccount("source-1", {
  currency: getCryptoCurrencyById("hypercore"),
  operationsSize: 0,
});
const destinationAccount = genAccount("eth-1", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 0,
});

const quote: WithdrawQuote = {
  quoteId: "quote-1",
  amountTo: new BigNumber("0.3"),
  payoutNetworkFees: new BigNumber("0.0004"),
  expiry: Date.now() + 60_000,
};

// The formatter separates the value from the ticker with a non-breaking space.
const normalize = (summary: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(summary).map(([key, value]) => [key, value.replace(/\u00a0/g, " ")]),
  );

const params = {
  amount: new BigNumber(10),
  quote,
  sourceAccount,
  destinationAccount,
  locale: "en",
};

describe("getPerpsWithdrawSummary", () => {
  it("formats the sent and received amounts with their tickers", () => {
    const summary = normalize(getPerpsWithdrawSummary(params));

    expect(summary.amountSent).toBe("10 USDC");
    expect(summary.amountReceived).toBe("0.3 ETH");
  });

  it("adds the Hyperliquid fee to the payout fee", () => {
    expect(normalize(getPerpsWithdrawSummary(params)).networkFees).toBe("0.0004 ETH + 1 USDC");
  });

  it("shows only the Hyperliquid fee when there is no payout fee", () => {
    const summary = normalize(
      getPerpsWithdrawSummary({
        ...params,
        quote: { ...quote, payoutNetworkFees: new BigNumber(0) },
      }),
    );

    expect(summary.networkFees).toBe("1 USDC");
  });

  it("debits the amount plus the Hyperliquid fee", () => {
    expect(normalize(getPerpsWithdrawSummary(params)).totalDebited).toBe("11 USDC");
  });

  it("keeps every decimal of the amount sent, which the device shows as is", () => {
    const summary = normalize(
      getPerpsWithdrawSummary({ ...params, amount: new BigNumber("123456.789012") }),
    );

    expect(summary.amountSent).toBe("123,456.789012 USDC");
    expect(summary.totalDebited).toBe("123,457.789012 USDC");
  });
});
