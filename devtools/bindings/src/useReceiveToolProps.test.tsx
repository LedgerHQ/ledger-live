import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { convertApiToken, cryptoAssetsApi } from "@domain/api-currency-token";
import { AccountIdSchema, accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import { mockAccountAssetBalance } from "@domain/entity-account-balance/schema.mock";
import { accountNamesSlice, setAccountName } from "@domain/entity-account-name";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import featureFlagsReducer, { createFeatureFlagsMiddleware } from "@shared/feature-flags";
import { useReceiveToolProps, type ReceiveToolTrigger } from "./useReceiveToolProps";

const ethereum = mockAddressAccountDescriptor();
const bitcoin = mockUtxoAccountDescriptor();
const ethereumUUID = computeAccountUUID(ethereum);
const bitcoinUUID = computeAccountUUID(bitcoin);
const USDT = "ethereum/erc20/usd-tether";
const USDC = "ethereum/erc20/usd__coin";
const tether = convertApiToken({
  id: USDT,
  contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  name: "Tether USD",
  ticker: "USDT",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
  standard: "erc20",
});

function buildStore() {
  const store = configureStore({
    reducer: {
      featureFlags: featureFlagsReducer,
      accountEntries: accountsSlice.reducer,
      accountBalances: accountBalancesSlice.reducer,
      wallet: combineReducers({ accountNames: accountNamesSlice.reducer }),
      [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer,
    },
    preloadedState: {
      accountBalances: {
        [ethereumUUID]: [
          mockAccountAssetBalance({ assetId: "ethereum" }),
          mockAccountAssetBalance({ assetId: USDT }),
          mockAccountAssetBalance({ assetId: USDC }),
        ],
      },
    },
    middleware: gdm =>
      gdm({ serializableCheck: false }).concat(
        cryptoAssetsApi.middleware,
        createFeatureFlagsMiddleware({ resolutionConfig: {} }),
      ),
  });
  store.dispatch(
    legacyAccountsSynced([
      { accountUUID: ethereumUUID, descriptor: ethereum, legacyId: AccountIdSchema.parse("eth") },
      { accountUUID: bitcoinUUID, descriptor: bitcoin, legacyId: AccountIdSchema.parse("btc") },
    ]),
  );
  store.dispatch(setAccountName({ accountId: "eth", name: "Savings" }));
  return store;
}

function mockTrigger(): ReceiveToolTrigger {
  return { onReceive: jest.fn(), onPickAsset: jest.fn(), onOpenDeeplink: jest.fn() };
}

function renderTool(trigger: ReceiveToolTrigger = mockTrigger()) {
  const store = buildStore();
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result, rerender } = renderHook(
    ({ hostTrigger }: { hostTrigger: ReceiveToolTrigger }) => useReceiveToolProps(hostTrigger),
    { wrapper, initialProps: { hostTrigger: trigger } },
  );
  return { store, result, rerender };
}

describe("useReceiveToolProps", () => {
  it("reads the flag off with no excluded family by default", () => {
    const { result } = renderTool();

    expect(result.current.flag.enabled).toBe(false);
    expect(result.current.flag.excludedFamilies).toEqual([]);
  });

  it("turns the flag on and keeps the excluded families", () => {
    const { store, result } = renderTool();

    act(() => result.current.flag.setExcludedFamilies(["tron"]));
    act(() => result.current.flag.setEnabled(true));

    expect(store.getState().featureFlags.overrides.newReceiveFlow).toEqual({
      enabled: true,
      params: { excludedFamilies: ["tron"] },
    });
    expect(result.current.flag).toMatchObject({ enabled: true, excludedFamilies: ["tron"] });
  });

  it("lists each account by its name, or its coin name when it has none", () => {
    const { result } = renderTool();

    const coinRows = result.current.trigger.assets.filter(asset => !asset.networkId);
    expect(coinRows).toEqual([
      {
        id: `${ethereumUUID}:ethereum`,
        legacyAccountId: "eth",
        assetId: "ethereum",
        label: "Savings",
        ticker: "ETH",
        currencyId: "ethereum",
        network: "Ethereum",
      },
      {
        id: `${bitcoinUUID}:bitcoin`,
        legacyAccountId: "btc",
        assetId: "bitcoin",
        label: "Bitcoin",
        ticker: "BTC",
        currencyId: "bitcoin",
        network: "Bitcoin",
      },
    ]);
  });

  it("lists each token of an account's balances, by its CAL name once CAL resolved it", async () => {
    const { store, result } = renderTool();

    act(() => {
      store.dispatch(cryptoAssetsApi.util.upsertQueryData("findTokenById", { id: USDT }, tether));
    });

    const tokenRows = () => result.current.trigger.assets.filter(asset => asset.networkId);
    await waitFor(() => expect(tokenRows()[0]?.label).toBe("Tether USD · Savings"));
    expect(tokenRows()).toEqual([
      {
        id: `${ethereumUUID}:${USDT}`,
        legacyAccountId: "eth",
        assetId: USDT,
        label: "Tether USD · Savings",
        ticker: "USDT",
        currencyId: USDT,
        network: "Ethereum",
        networkId: "ethereum",
      },
      {
        id: `${ethereumUUID}:${USDC}`,
        legacyAccountId: "eth",
        assetId: USDC,
        label: `${USDC} · Savings`,
        ticker: USDC,
        currencyId: USDC,
        network: "Ethereum",
        networkId: "ethereum",
      },
    ]);
  });

  it("calls the host's latest openers through a stable trigger", () => {
    const first = mockTrigger();
    const latest = mockTrigger();
    const { result, rerender } = renderTool(first);
    const { trigger } = result.current;

    rerender({ hostTrigger: latest });
    result.current.trigger.onReceive({ legacyAccountId: "eth", assetId: USDT });
    result.current.trigger.onPickAsset();
    result.current.trigger.onOpenDeeplink("ledgerwallet://receive");

    expect(result.current.trigger).toBe(trigger);
    expect(first.onReceive).not.toHaveBeenCalled();
    expect(latest.onReceive).toHaveBeenCalledWith({ legacyAccountId: "eth", assetId: USDT });
    expect(latest.onPickAsset).toHaveBeenCalledTimes(1);
    expect(latest.onOpenDeeplink).toHaveBeenCalledWith("ledgerwallet://receive");
  });
});
