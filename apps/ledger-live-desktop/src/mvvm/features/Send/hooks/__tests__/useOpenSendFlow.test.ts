import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { AssetCategory } from "@domain/api-aggregated-assets";
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

  it("forwards categories to the account selection drawer without leaking them into the send params", () => {
    const account = genAccount("send-account-selection-categories", {
      currency: getCryptoCurrencyById("ethereum"),
    });

    const { result, store } = renderHook(() => useOpenSendFlow(), {
      initialState: {
        ...withFlagOverrides({
          newSendFlow: {
            enabled: true,
            params: { families: ["evm"], excludedCurrencyIds: [] },
          },
        }),
        accounts: [account],
      },
    });

    result.current({
      source: "Pay",
      categories: [AssetCategory.Stablecoins],
    });

    expect(store.getState().modularDialog.isOpen).toBe(true);
    expect(store.getState().modularDialog.flow).toBe("send");
    expect(store.getState().modularDialog.source).toBe("Pay");
    expect(store.getState().modularDialog.dialogParams?.categories).toEqual([
      AssetCategory.Stablecoins,
    ]);

    store.getState().modularDialog.dialogParams?.onAccountSelected?.(account);

    expect(store.getState().sendFlow.isOpen).toBe(true);
    expect(store.getState().sendFlow.data?.params).not.toHaveProperty("categories");
    expect(store.getState().sendFlow.data?.params).toEqual(
      expect.objectContaining({ source: "Pay" }),
    );
  });

  it("forwards the source into the send params when an account is preselected", () => {
    const account = genAccount("send-preselected-source", {
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
      account,
      source: "Pay",
    });

    expect(store.getState().sendFlow.isOpen).toBe(true);
    expect(store.getState().sendFlow.data?.params).toEqual(
      expect.objectContaining({ account, source: "Pay" }),
    );
  });

  it("preserves the direct-recipient intent after account selection", () => {
    const account = genAccount("send-contact-account-selection", {
      currency: getCryptoCurrencyById("bitcoin"),
    });
    const recipient = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
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
      currencyIds: ["bitcoin"],
      recipient,
      skipRecipientStep: true,
    });
    store.getState().modularDialog.dialogParams?.onAccountSelected?.(account);

    expect(store.getState().sendFlow.data?.params).toEqual(
      expect.objectContaining({
        account,
        recipient,
        skipRecipientStep: true,
      }),
    );
  });
});
