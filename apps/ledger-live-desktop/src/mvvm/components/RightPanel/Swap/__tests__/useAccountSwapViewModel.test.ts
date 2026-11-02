import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { renderHook } from "tests/testSetup";
import { getAccountUrl } from "~/renderer/utils";
import { useAccountSwapViewModel } from "../useAccountSwapViewModel";

const ethAccount = genAccount("account-swap-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  subAccountsCount: 0,
});

const renderOn = (pathname: string) =>
  renderHook(() => useAccountSwapViewModel(pathname), {
    initialState: { accounts: [ethAccount] },
  });

describe("useAccountSwapViewModel", () => {
  it("prefills the swap with the account and its asset", () => {
    const pathname = getAccountUrl(ethAccount.id);

    const { result } = renderOn(pathname);

    expect(result.current.initialSwapState).toEqual({
      defaultAmountFrom: "0",
      from: pathname,
      defaultCurrency: { toCurrencyId: "ethereum" },
      defaultAccountId: ethAccount.id,
      defaultParentAccountId: undefined,
    });
    expect(result.current.webviewKey).toBe(`ethereum::${ethAccount.id}`);
  });

  it("falls back to an empty swap for an unknown account", () => {
    const { result } = renderOn(getAccountUrl("unknown"));

    expect(result.current.initialSwapState).toBeUndefined();
    expect(result.current.webviewKey).toBe("none::none");
  });
});
