import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { getAccountUrl } from "~/renderer/utils";
import { useIsAccountDetailPage } from "../useIsAccountDetailPage";

const btcAccount = genAccount("is-account-detail-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
});

function renderIsAccountDetailPage(
  pathname: string,
  accountDetail: { enabled: boolean; params?: { excludedCurrencyIds: string[] } },
) {
  return renderHook(() => useIsAccountDetailPage(pathname), {
    initialState: { ...withFlagOverrides({ accountDetail }), accounts: [btcAccount] },
  });
}

describe("useIsAccountDetailPage", () => {
  it("is true on an account page when the flag is on", () => {
    const { result } = renderIsAccountDetailPage(getAccountUrl(btcAccount.id), { enabled: true });

    expect(result.current).toBe(true);
  });

  it("is false when the flag is off", () => {
    const { result } = renderIsAccountDetailPage(getAccountUrl(btcAccount.id), { enabled: false });

    expect(result.current).toBe(false);
  });

  it("is false for an excluded currency", () => {
    const { result } = renderIsAccountDetailPage(getAccountUrl(btcAccount.id), {
      enabled: true,
      params: { excludedCurrencyIds: ["bitcoin"] },
    });

    expect(result.current).toBe(false);
  });

  it("is false outside account pages", () => {
    const { result } = renderIsAccountDetailPage("/asset/bitcoin", { enabled: true });

    expect(result.current).toBe(false);
  });
});
