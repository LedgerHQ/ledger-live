import React, { type FC, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { getCryptoCurrencyById, listCryptoCurrencies } from "@domain/entity-currency-crypto";
import {
  FEATURE_FLAGS_DEFAULTS,
  FEATURE_FLAGS_INITIAL_STATE,
  featureFlagsReducer,
  type Features,
} from "@shared/feature-flags";
import type { ContactsCurrencySelectionPort } from "../model/ports";
import {
  type AddAddressCurrencySelectionResult,
  useAddAddressCurrencySelectionViewModel,
} from "./useAddAddressCurrencySelectionViewModel";

const ETHEREUM_CURRENCY_ID = getCryptoCurrencyById("ethereum").id;
const ETHEREUM_SELECTION = {
  currencyId: ETHEREUM_CURRENCY_ID,
  assetDisplayName: "Ethereum",
} as const;

function makeWrapper(contactsFeature?: Features["lwdContacts"]) {
  const resolved: Features = {
    ...FEATURE_FLAGS_DEFAULTS,
    ...(contactsFeature ? { lwdContacts: contactsFeature } : undefined),
  };
  const store = configureStore({
    reducer: { featureFlags: featureFlagsReducer },
    preloadedState: {
      featureFlags: {
        ...FEATURE_FLAGS_INITIAL_STATE,
        resolved,
      },
    },
  });
  const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );

  return Wrapper;
}

function renderViewModel(
  currencySelection: ContactsCurrencySelectionPort,
  contactsFeature?: Features["lwdContacts"],
) {
  return renderHook(
    () =>
      useAddAddressCurrencySelectionViewModel({
        platform: "desktop",
        currencySelection,
      }),
    { wrapper: makeWrapper(contactsFeature) },
  );
}

describe("useAddAddressCurrencySelectionViewModel", () => {
  it("passes production EVM network ids when feature params are missing", async () => {
    const selectCurrency = jest.fn().mockResolvedValue(null);
    const { result } = renderViewModel({ selectCurrency }, { enabled: true });
    const expectedNetworkIds = listCryptoCurrencies()
      .filter(network => network.family === "evm")
      .map(network => network.id);

    let selectionResult: AddAddressCurrencySelectionResult | undefined;
    await act(async () => {
      selectionResult = await result.current.selectCurrency();
    });

    expect(selectCurrency).toHaveBeenCalledWith(expectedNetworkIds);
    expect(selectionResult).toEqual({ status: "cancelled" });
  });

  it("stores the final eligible crypto-or-token currency selected by MAD", async () => {
    const selection = {
      currencyId: "ethereum/erc20/usd-tether",
      assetDisplayName: "Tether USD",
    } as const;
    const selectCurrency = jest.fn().mockResolvedValue(selection);
    const { result } = renderViewModel(
      { selectCurrency },
      {
        enabled: true,
        params: {
          newBadge: false,
          eligibleAddressFamilies: ["evm", "bitcoin"],
        },
      },
    );
    const expectedNetworkIds = listCryptoCurrencies()
      .filter(network => network.family === "evm" || network.family === "bitcoin")
      .map(network => network.id);

    let selectionResult: AddAddressCurrencySelectionResult | undefined;
    await act(async () => {
      selectionResult = await result.current.selectCurrency();
    });

    expect(selectCurrency).toHaveBeenCalledWith(expectedNetworkIds);
    expect(result.current.selectedCurrency).toEqual(selection);
    expect(selectionResult).toEqual({
      status: "selected",
      selection,
    });
  });

  it("preserves the selected currency when MAD is cancelled", async () => {
    const selectCurrency = jest
      .fn()
      .mockResolvedValueOnce(ETHEREUM_SELECTION)
      .mockResolvedValueOnce(null);
    const { result } = renderViewModel({ selectCurrency });

    await act(async () => {
      await result.current.selectCurrency();
      expect(await result.current.selectCurrency()).toEqual({ status: "cancelled" });
    });

    expect(result.current.selectedCurrency).toEqual(ETHEREUM_SELECTION);
  });

  it("does not open MAD when no production network matches the eligible families", async () => {
    const selectCurrency = jest.fn().mockResolvedValue(null);
    const { result } = renderViewModel(
      { selectCurrency },
      {
        enabled: true,
        params: {
          newBadge: false,
          eligibleAddressFamilies: ["unknown"],
        },
      },
    );

    let selectionResult: AddAddressCurrencySelectionResult | undefined;
    await act(async () => {
      selectionResult = await result.current.selectCurrency();
    });

    expect(selectCurrency).not.toHaveBeenCalled();
    expect(selectionResult).toEqual({ status: "unavailable" });
  });

  it("ignores concurrent selection requests while MAD is open", async () => {
    let resolveSelection: (selection: typeof ETHEREUM_SELECTION) => void = () => undefined;
    const selectCurrency = jest.fn(
      () =>
        new Promise<typeof ETHEREUM_SELECTION>(resolve => {
          resolveSelection = resolve;
        }),
    );
    const { result } = renderViewModel({ selectCurrency });

    let firstSelection: ReturnType<typeof result.current.selectCurrency>;
    let concurrentSelectionResult: AddAddressCurrencySelectionResult | undefined;
    await act(async () => {
      firstSelection = result.current.selectCurrency();
      concurrentSelectionResult = await result.current.selectCurrency();
      resolveSelection(ETHEREUM_SELECTION);
      await firstSelection;
    });

    expect(selectCurrency).toHaveBeenCalledTimes(1);
    expect(concurrentSelectionResult).toEqual({ status: "busy" });
    expect(result.current.selectedCurrency).toEqual(ETHEREUM_SELECTION);
  });

  it("returns a cancelled result and allows retrying when the selection port rejects", async () => {
    const selectCurrency = jest
      .fn()
      .mockRejectedValueOnce(new Error("MAD unavailable"))
      .mockResolvedValueOnce(ETHEREUM_SELECTION);
    const { result } = renderViewModel({ selectCurrency });

    await act(async () => {
      expect(await result.current.selectCurrency()).toEqual({ status: "cancelled" });
      expect(await result.current.selectCurrency()).toEqual({
        status: "selected",
        selection: ETHEREUM_SELECTION,
      });
    });

    expect(selectCurrency).toHaveBeenCalledTimes(2);
    expect(result.current.selectedCurrency).toEqual(ETHEREUM_SELECTION);
  });
});
