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
import type { ContactsCurrencySelectionPort } from "./model/ports";
import { useAddAddressCurrencySelectionViewModel } from "./useAddAddressCurrencySelectionViewModel";

const ETHEREUM_CURRENCY_ID = getCryptoCurrencyById("ethereum").id;

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

    await act(() => result.current.selectCurrency());

    expect(selectCurrency).toHaveBeenCalledWith(expectedNetworkIds);
  });

  it("stores the final eligible crypto-or-token currency id selected by MAD", async () => {
    const selectCurrency = jest.fn().mockResolvedValue("ethereum/erc20/usd-tether");
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

    await act(() => result.current.selectCurrency());

    expect(selectCurrency).toHaveBeenCalledWith(expectedNetworkIds);
    expect(result.current.selectedCurrencyId).toBe("ethereum/erc20/usd-tether");
  });

  it("preserves the selected currency id when MAD is cancelled", async () => {
    const selectCurrency = jest.fn().mockResolvedValueOnce("ethereum").mockResolvedValueOnce(null);
    const { result } = renderViewModel({ selectCurrency });

    await act(() => result.current.selectCurrency());
    await act(() => result.current.selectCurrency());

    expect(result.current.selectedCurrencyId).toBe("ethereum");
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

    await act(() => result.current.selectCurrency());

    expect(selectCurrency).not.toHaveBeenCalled();
  });

  it("ignores concurrent selection requests while MAD is open", async () => {
    let resolveSelection: (currencyId: typeof ETHEREUM_CURRENCY_ID) => void = () => undefined;
    const selectCurrency = jest.fn(
      () =>
        new Promise<typeof ETHEREUM_CURRENCY_ID>(resolve => {
          resolveSelection = resolve;
        }),
    );
    const { result } = renderViewModel({ selectCurrency });

    let firstSelection: Promise<void>;
    await act(async () => {
      firstSelection = result.current.selectCurrency();
      await result.current.selectCurrency();
      resolveSelection(ETHEREUM_CURRENCY_ID);
      await firstSelection;
    });

    expect(selectCurrency).toHaveBeenCalledTimes(1);
    expect(result.current.selectedCurrencyId).toBe("ethereum");
  });
});
