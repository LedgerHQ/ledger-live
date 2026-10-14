/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook } from "@testing-library/react";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { BridgeSyncContext } from "../../../../bridge/react/context";
import { findRefreshedAccount, useSyncSendFlowAccount } from "../useSyncSendFlowAccount";

const makeTokenAccount = (id: string, parentId: string): TokenAccount =>
  ({ type: "TokenAccount", id, parentId }) as TokenAccount;

const makeAccount = (id: string, subAccounts: TokenAccount[] = []): Account =>
  ({ type: "Account", id, subAccounts }) as unknown as Account;

describe("findRefreshedAccount", () => {
  it("returns the store version of a main account", () => {
    const stale = makeAccount("main");
    const fresh = makeAccount("main");

    expect(findRefreshedAccount([fresh], stale, null)).toEqual({
      account: fresh,
      parentAccount: null,
    });
  });

  it("returns the store version of a token account and its parent", () => {
    const staleParent = makeAccount("main", [makeTokenAccount("token", "main")]);
    const freshToken = makeTokenAccount("token", "main");
    const freshParent = makeAccount("main", [freshToken]);

    expect(findRefreshedAccount([freshParent], staleParent.subAccounts![0], staleParent)).toEqual({
      account: freshToken,
      parentAccount: freshParent,
    });
  });

  it("returns null when the account is not in the store", () => {
    expect(findRefreshedAccount([], makeAccount("main"), null)).toBeNull();
  });
});

describe("useSyncSendFlowAccount", () => {
  const renderWithSync = (sync: jest.Mock, props: Parameters<typeof useSyncSendFlowAccount>[0]) =>
    renderHook(p => useSyncSendFlowAccount(p), {
      initialProps: props,
      wrapper: ({ children }) => (
        <BridgeSyncContext.Provider value={sync}>{children}</BridgeSyncContext.Provider>
      ),
    });

  it("syncs the main account once when the flow opens", () => {
    const sync = jest.fn();
    const account = makeAccount("main");
    const { rerender } = renderWithSync(sync, {
      account,
      parentAccount: null,
      accounts: [account],
      onAccountRefreshed: jest.fn(),
    });

    rerender({
      account,
      parentAccount: null,
      accounts: [account],
      onAccountRefreshed: jest.fn(),
    });

    expect(sync).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledWith({
      type: "SYNC_ONE_ACCOUNT",
      accountId: "main",
      priority: 100,
      reason: "transaction-flow-init",
    });
  });

  it("syncs the parent account of a token account", () => {
    const sync = jest.fn();
    const token = makeTokenAccount("token", "main");
    const parent = makeAccount("main", [token]);
    renderWithSync(sync, {
      account: token,
      parentAccount: parent,
      accounts: [parent],
      onAccountRefreshed: jest.fn(),
    });

    expect(sync).toHaveBeenCalledWith(expect.objectContaining({ accountId: "main" }));
  });

  it("does not sync when no account is selected", () => {
    const sync = jest.fn();
    renderWithSync(sync, {
      account: null,
      parentAccount: null,
      accounts: [],
      onAccountRefreshed: jest.fn(),
    });

    expect(sync).not.toHaveBeenCalled();
  });

  it("reports the synced account once the store updates", () => {
    const onAccountRefreshed = jest.fn();
    const account = makeAccount("main");
    const { rerender } = renderWithSync(jest.fn(), {
      account,
      parentAccount: null,
      accounts: [account],
      onAccountRefreshed,
    });

    expect(onAccountRefreshed).not.toHaveBeenCalled();

    const synced = makeAccount("main");
    rerender({ account, parentAccount: null, accounts: [synced], onAccountRefreshed });

    expect(onAccountRefreshed).toHaveBeenCalledWith(synced, null);
  });
});
