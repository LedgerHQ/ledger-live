import React, { type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { SettingsPortProvider } from "@features/flow-settings";
import { createFakeAssetManagementPort } from "./__tests__/fakeAssetManagementPort";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import type { AssetManagementSettingsValues, HiddenTokenGroup } from "./types";
import { useAssetManagementViewModel } from "./useAssetManagementViewModel";

const HIDDEN_TOKENS: readonly HiddenTokenGroup[] = [
  {
    network: { id: "ethereum", name: "Ethereum" },
    tokens: [
      { id: "ethereum/erc20/usd_tether__erc20_", name: "Tether USD", ticker: "USDT" },
      { id: "ethereum/erc20/link", name: "Chainlink", ticker: "LINK" },
    ],
  },
  {
    network: { id: "polygon", name: "Polygon" },
    tokens: [{ id: "polygon/erc20/usd_coin", name: "USD Coin", ticker: "USDC" }],
  },
];

function renderViewModel(
  initial?: Partial<AssetManagementSettingsValues>,
  hiddenTokens?: readonly HiddenTokenGroup[],
) {
  const fake = createFakeAssetManagementPort(initial, hiddenTokens);
  const hook = renderHook(() => useAssetManagementViewModel({ testID: "section" }), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <I18nWrapper>
        <SettingsPortProvider value={fake.port}>{children}</SettingsPortProvider>
      </I18nWrapper>
    ),
  });
  const row = (id: string) => hook.result.current.rows.find(candidate => candidate.id === id);
  return { ...fake, ...hook, row };
}

describe("useAssetManagementViewModel", () => {
  it("lists the two toggles then the hidden tokens, with their wording", () => {
    const { result } = renderViewModel();

    expect(result.current.rows.map(({ id, title }) => ({ id, title }))).toEqual([
      { id: "hideEmptyTokenAccounts", title: "Hide empty token accounts" },
      { id: "filterTokenOperationsZeroAmount", title: "Hide token transactions when value is 0" },
      { id: "hiddenTokens", title: "Hidden tokens" },
    ]);
    expect(result.current.testID).toBe("section");
  });

  it("reflects the current values in the toggles", () => {
    const { row } = renderViewModel({
      hideEmptyTokenAccounts: true,
      filterTokenOperationsZeroAmount: false,
    });

    expect(row("hideEmptyTokenAccounts")?.trailing).toMatchObject({ type: "toggle", value: true });
    expect(row("filterTokenOperationsZeroAmount")?.trailing).toMatchObject({
      type: "toggle",
      value: false,
    });
  });

  it("sends each toggle change to the port under its own key", () => {
    const { row, updates } = renderViewModel();

    act(() => {
      const hideEmpty = row("hideEmptyTokenAccounts")?.trailing;
      if (hideEmpty?.type === "toggle") hideEmpty.onToggle(true);
    });
    act(() => {
      const filterZero = row("filterTokenOperationsZeroAmount")?.trailing;
      if (filterZero?.type === "toggle") filterZero.onToggle(true);
    });

    expect(updates).toEqual([
      { key: "hideEmptyTokenAccounts", value: true },
      { key: "filterTokenOperationsZeroAmount", value: true },
    ]);
  });

  it("opens the hidden tokens list from the Manage button", () => {
    const { result, row } = renderViewModel(undefined, HIDDEN_TOKENS);

    expect(row("hiddenTokens")?.trailing).toMatchObject({ type: "button", label: "Manage" });
    expect(result.current.hiddenTokens.isOpen).toBe(false);

    act(() => {
      const manage = row("hiddenTokens")?.trailing;
      if (manage?.type === "button") manage.onSelect();
    });

    expect(result.current.hiddenTokens).toMatchObject({
      isOpen: true,
      title: "Hidden tokens",
      description: "Select a token to display it in Ledger Wallet",
      emptyLabel: "You have no hidden tokens.",
    });
  });

  it("groups the hidden tokens by network, each with its show action", () => {
    const { result, showToken } = renderViewModel(undefined, HIDDEN_TOKENS);
    const { groups } = result.current.hiddenTokens;

    expect(
      groups.map(({ network, tokens }) => [network.name, tokens.map(token => token.showLabel)]),
    ).toEqual([
      ["Ethereum", ["Show Tether USD", "Show Chainlink"]],
      ["Polygon", ["Show USD Coin"]],
    ]);

    act(() => groups[1].tokens[0].onShow());

    expect(showToken.mock.calls).toEqual([["polygon/erc20/usd_coin"]]);
  });

  it("tells the app once the hidden tokens list closes", () => {
    const { result, row, onHiddenTokensClosed } = renderViewModel(undefined, HIDDEN_TOKENS);

    act(() => {
      const manage = row("hiddenTokens")?.trailing;
      if (manage?.type === "button") manage.onSelect();
    });
    expect(onHiddenTokensClosed).not.toHaveBeenCalled();

    act(() => result.current.hiddenTokens.onClose());

    expect(result.current.hiddenTokens.isOpen).toBe(false);
    expect(onHiddenTokensClosed).toHaveBeenCalledTimes(1);
  });

  it("follows the toggles and the hidden tokens list in the desktop state events", () => {
    const { result, row } = renderViewModel({ hideEmptyTokenAccounts: true });

    expect(result.current.stateEvents).toEqual([
      { id: "hideEmptyTokenAccounts", event: "hideEmptyTokenAccountsEnabled" },
      { id: "filterTokenOperationsZeroAmount", event: "filterTokenOperationsZeroAmountDisabled" },
      { id: "hiddenTokens", event: "BlacklistedTokens dropdown", properties: { opened: false } },
    ]);

    act(() => {
      const manage = row("hiddenTokens")?.trailing;
      if (manage?.type === "button") manage.onSelect();
    });

    expect(result.current.stateEvents[2]).toEqual({
      id: "hiddenTokens",
      event: "BlacklistedTokens dropdown",
      properties: { opened: true },
    });
  });
});
