import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { renderHook } from "@tests/test-renderer";
import { useTransactionHeaderViewModel } from "../useTransactionHeaderViewModel";

const sendCurrency = getCryptoCurrencyById("hypercore");
const receiveCurrency = getCryptoCurrencyById("ethereum");

function renderHeader(props: { origin?: "swap" | "perps"; isPerpsWithdraw?: boolean }) {
  return renderHook(() =>
    useTransactionHeaderViewModel({ sendCurrency, receiveCurrency, locale: "en", ...props }),
  ).result.current;
}

describe("useTransactionHeaderViewModel", () => {
  it("titles a perps withdraw as a withdraw, even when opened from Swap History", () => {
    expect(renderHeader({ isPerpsWithdraw: true })).toMatchObject({
      title: "Withdraw",
      currencies: `${sendCurrency.ticker} → ${receiveCurrency.ticker}`,
    });
  });

  it("titles a transaction opened from perps as a deposit", () => {
    expect(renderHeader({ origin: "perps" }).title).toBe("Fund Perpetuals");
  });

  it("titles any other transaction as a swap, without the perps currencies line", () => {
    const header = renderHeader({});

    expect(header.title).toContain(sendCurrency.ticker);
    expect(header.currencies).toBeUndefined();
  });
});
