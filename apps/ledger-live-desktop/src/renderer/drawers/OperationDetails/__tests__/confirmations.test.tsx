import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, Operation } from "@ledgerhq/types-live";
import { importLLDCoinFamily } from "~/renderer/families";
import { updateAccount } from "~/renderer/actions/accounts";
import { OperationDetails } from "..";

// The status line does not depend on the bridge, which would otherwise suspend the drawer.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ isEditableOperation: () => false, isStuckOperation: () => false }),
}));

// Preload so useLLDCoinFamily resolves synchronously on first render instead of suspending.
beforeAll(async () => {
  await Promise.all([importLLDCoinFamily("bitcoin"), importLLDCoinFamily("zcash")]);
});

const baseOperation = {
  id: "op-1",
  hash: "0xhash",
  type: "IN",
  value: new BigNumber(1000),
  fee: new BigNumber(100),
  senders: ["sender1"],
  recipients: ["recipient1"],
  blockHash: "hash",
  blockHeight: 90,
  date: new Date(),
  extra: {},
} as unknown as Operation;

const ACCOUNT_ID = "js:2:bitcoin:xpub1:native_segwit";
const operation = { ...baseOperation, accountId: ACCOUNT_ID } as Operation;

const makeAccount = (currencyId: string): Account => ({
  ...createFixtureAccount(),
  id: ACCOUNT_ID,
  currency: getCryptoCurrencyById(currencyId),
  blockHeight: 1000,
  operations: [operation],
  pendingOperations: [],
});

const renderDrawer = (account: Account) =>
  render(<OperationDetails operationId={operation.id} accountId={account.id} />, {
    initialState: { accounts: [account] },
  });

describe("OperationDetails confirmations", () => {
  it("labels the confirmation count of a Zcash operation", async () => {
    renderDrawer(makeAccount("zcash"));

    expect(await screen.findByTestId("status-drawer")).toHaveTextContent(
      "Confirmed (911 confirmations)",
    );
  });

  it("keeps the bare count for a Bitcoin operation", async () => {
    renderDrawer(makeAccount("bitcoin"));

    const status = await screen.findByTestId("status-drawer");
    expect(status).toHaveTextContent("Confirmed (911)");
    expect(status).not.toHaveTextContent("confirmations");
  });

  it("shows the confirmed operation when sync replaces the pending operation", async () => {
    const pendingOperation = {
      ...operation,
      id: `${ACCOUNT_ID}-${operation.hash}-OUT`,
      type: "OUT",
      blockHash: null,
      blockHeight: null,
    } as unknown as Operation;
    const confirmedOperation = {
      ...operation,
      id: `${ACCOUNT_ID}-${operation.hash}-FEES`,
      type: "FEES",
    } as Operation;
    const account = {
      ...makeAccount("bitcoin"),
      operations: [],
      pendingOperations: [pendingOperation],
    };
    const { store } = render(
      <OperationDetails
        operationId={pendingOperation.id}
        hash={pendingOperation.hash}
        accountId={account.id}
      />,
      { initialState: { accounts: [account] } },
    );

    expect(await screen.findByTestId("transaction-type")).toHaveTextContent("Sent");

    await act(async () => {
      store.dispatch(
        updateAccount({ ...account, operations: [confirmedOperation], pendingOperations: [] }),
      );
    });

    expect(await screen.findByTestId("transaction-type")).toHaveTextContent("Fees");
  });

  it("prefers a confirmed operation over a pending operation with the same hash", async () => {
    const confirmedOperation = {
      ...operation,
      id: `${ACCOUNT_ID}-${operation.hash}-FEES`,
      type: "FEES",
    } as Operation;
    const pendingOperation = {
      ...operation,
      id: `${ACCOUNT_ID}-${operation.hash}-OUT`,
      type: "OUT",
      blockHash: null,
      blockHeight: null,
    } as unknown as Operation;
    const account = {
      ...makeAccount("bitcoin"),
      operations: [confirmedOperation],
      pendingOperations: [pendingOperation],
    };

    render(
      <OperationDetails
        operationId="removed-operation"
        hash={operation.hash}
        accountId={account.id}
      />,
      { initialState: { accounts: [account] } },
    );

    expect(await screen.findByTestId("transaction-type")).toHaveTextContent("Fees");
  });

  it("falls back to a pending top-level operation when no confirmed operation matches", async () => {
    const pendingOperation = {
      ...operation,
      id: `${ACCOUNT_ID}-${operation.hash}-OUT`,
      type: "OUT",
      blockHash: null,
      blockHeight: null,
    } as unknown as Operation;
    const account = {
      ...makeAccount("bitcoin"),
      operations: [],
      pendingOperations: [pendingOperation],
    };

    render(
      <OperationDetails
        operationId="removed-operation"
        hash={operation.hash}
        accountId={account.id}
      />,
      { initialState: { accounts: [account] } },
    );

    expect(await screen.findByTestId("transaction-type")).toHaveTextContent("Sent");
  });

  it("does not fall back to an internal operation with the same hash", () => {
    const internalOperation = { ...operation, id: "internal-operation" } as Operation;
    const account = {
      ...makeAccount("bitcoin"),
      operations: [{ ...operation, hash: "parent-hash", internalOperations: [internalOperation] }],
    };

    render(
      <OperationDetails
        operationId="removed-operation"
        hash={operation.hash}
        accountId={account.id}
      />,
      { initialState: { accounts: [account] } },
    );

    expect(screen.queryByTestId("transaction-type")).not.toBeInTheDocument();
  });
});
