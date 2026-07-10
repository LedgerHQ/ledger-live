/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { useDappAccountLogic } from "../useDappAccountLogic";

jest.mock("../../../account", () => ({
  getParentAccount: jest.fn(),
}));

const { getParentAccount } = jest.requireMock("../../../account");

const ethAccount = {
  type: "Account",
  id: "eth-1",
  freshAddress: "0xETH",
  currency: { id: "ethereum" },
} as never;

const tokenAccount = {
  type: "TokenAccount",
  id: "usdc-1",
  token: { id: "ethereum/erc20/usd__coin", parentCurrencyId: "ethereum" },
} as never;

const polygonAccount = {
  type: "Account",
  id: "matic-1",
  freshAddress: "0xMATIC",
  currency: { id: "polygon" },
} as never;

function buildManifest(id: string) {
  return {
    id,
    dapp: { networks: [{ currency: "ethereum", chainID: 1 }] },
  } as never;
}

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store }, children);
  };
}

function render(props: Parameters<typeof useDappAccountLogic>[0]) {
  return renderHook(() => useDappAccountLogic(props), {
    wrapper: createWrapper(createStore()),
  });
}

describe("useDappAccountLogic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getParentAccount.mockReturnValue(undefined);
  });

  it("selects the initial account and writes it to history when initialAccountId is provided", () => {
    const setCurrentAccountHistDb = jest.fn();
    const { result } = render({
      manifest: buildManifest("dapp-initial"),
      accounts: [ethAccount, polygonAccount],
      setCurrentAccountHistDb,
      initialAccountId: "eth-1",
    });

    expect(result.current.currentAccount).toBe(ethAccount);
    expect(setCurrentAccountHistDb).toHaveBeenCalledTimes(1);
    // the history updater merges the selected account id under the manifest id
    const updater = setCurrentAccountHistDb.mock.calls[0][0];
    expect(updater({ currentAccountHist: {} })).toEqual({
      currentAccountHist: { "dapp-initial": "eth-1" },
    });
  });

  it("restores a compatible account from history (matched on account currency)", () => {
    const { result } = render({
      manifest: buildManifest("dapp-hist"),
      accounts: [ethAccount],
      currentAccountHistDb: { "dapp-hist": "eth-1" },
    });

    expect(result.current.currentAccountFromHist).toBe(ethAccount);
    expect(result.current.currentAccount).toBe(ethAccount);
  });

  it("restores a compatible token account from history (matched on parent currency)", () => {
    const { result } = render({
      manifest: buildManifest("dapp-hist-token"),
      accounts: [tokenAccount],
      currentAccountHistDb: { "dapp-hist-token": "usdc-1" },
    });

    expect(result.current.currentAccountFromHist).toBe(tokenAccount);
  });

  it("ignores a history account whose currency is not supported by the manifest", () => {
    const { result } = render({
      manifest: buildManifest("dapp-hist-incompatible"),
      accounts: [polygonAccount],
      currentAccountHistDb: { "dapp-hist-incompatible": "matic-1" },
    });

    expect(result.current.currentAccountFromHist).toBeUndefined();
    expect(result.current.currentAccount).toBeNull();
  });

  it("ignores history when the referenced account is not in the accounts list", () => {
    const { result } = render({
      manifest: buildManifest("dapp-hist-missing"),
      accounts: [ethAccount],
      currentAccountHistDb: { "dapp-hist-missing": "unknown-id" },
    });

    expect(result.current.currentAccountFromHist).toBeUndefined();
  });

  it("resolves the parent account of the current account", () => {
    getParentAccount.mockReturnValue(ethAccount);
    const { result } = render({
      manifest: buildManifest("dapp-parent"),
      accounts: [ethAccount, tokenAccount],
      currentAccountHistDb: { "dapp-parent": "usdc-1" },
    });

    expect(result.current.currentParentAccount).toBe(ethAccount);
    expect(getParentAccount).toHaveBeenCalledWith(tokenAccount, [ethAccount, tokenAccount]);
  });
});
