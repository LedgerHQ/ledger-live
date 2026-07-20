import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useOpenSendFlow } from "../useOpenSendFlow";

describe("useOpenSendFlow", () => {
  it("opens account selection filtered to the requested currencies when no account is preselected", () => {
    const account = genAccount("send-account-selection", {
      currency: getCryptoCurrencyById("bitcoin"),
    });
    const { result, store } = renderHook(() => useOpenSendFlow(), {
      initialState: {
        ...withFlagOverrides({
          newSendFlow: {
            enabled: true,
            params: { families: ["bitcoin"], excludedCurrencyIds: [] },
          },
        }),
        accounts: [account],
      },
    });

    result.current({
      source: "Asset Detail",
      currencyIds: ["bitcoin"],
    });

    expect(store.getState().modularDialog.isOpen).toBe(true);
    expect(store.getState().modularDialog.flow).toBe("send");
    expect(store.getState().modularDialog.source).toBe("Asset Detail");
    expect(store.getState().modularDialog.dialogParams?.currencies).toEqual(["bitcoin"]);
    expect(store.getState().modularDialog.dialogParams?.areCurrenciesFiltered).toBe(true);
    expect(store.getState().modularDialog.dialogParams?.onAccountSelected).toEqual(
      expect.any(Function),
    );
    expect(store.getState().sendFlow.isOpen).toBe(false);

    store.getState().modularDialog.dialogParams?.onAccountSelected?.(account);

    expect(store.getState().modularDialog.isOpen).toBe(false);
    expect(store.getState().sendFlow.isOpen).toBe(true);
    expect(store.getState().sendFlow.data?.params).toEqual(
      expect.objectContaining({
        account,
      }),
    );
  });
});
