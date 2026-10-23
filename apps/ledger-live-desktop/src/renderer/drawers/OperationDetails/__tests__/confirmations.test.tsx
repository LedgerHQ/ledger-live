import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, Operation } from "@ledgerhq/types-live";
import { importLLDCoinFamily } from "~/renderer/families";
import { OperationDetails } from "..";

// The status line does not depend on the bridge, which would otherwise suspend the drawer.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ isEditableOperation: () => false, isStuckOperation: () => false }),
}));

// Preload so useLLDCoinFamily resolves synchronously on first render instead of suspending.
beforeAll(async () => {
  await importLLDCoinFamily("bitcoin");
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
});
