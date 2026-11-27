import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, Operation } from "@ledgerhq/types-live";
import { getBridgeApi } from "@ledgerhq/live-common/bridge/generic-coin-framework/bridge";
import { replaceAccounts } from "~/renderer/actions/accounts";
import { importLLDCoinFamily } from "~/renderer/families";
import { OperationDetails } from "..";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ isEditableOperation: () => false, isStuckOperation: () => false }),
}));

jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/bridge", () => ({
  getBridgeApi: jest.fn(),
}));

beforeAll(async () => {
  await importLLDCoinFamily("evm");
});

beforeEach(() => {
  jest.mocked(getBridgeApi).mockResolvedValue({ getTokenFromAsset: async () => undefined });
});

const ACCOUNT_ID = "js:2:ethereum:0xabc:";
const HASH = "0xhash";
const FEE = new BigNumber("21000000000000");

const makeOperation = (overrides: Partial<Operation>): Operation =>
  ({
    id: `${ACCOUNT_ID}-${HASH}-OUT`,
    hash: HASH,
    accountId: ACCOUNT_ID,
    type: "OUT",
    value: new BigNumber(0),
    fee: FEE,
    senders: ["0xabc"],
    recipients: ["0xdef"],
    blockHash: null,
    blockHeight: null,
    date: new Date(),
    extra: {},
    ...overrides,
  }) as Operation;

const pendingOut = makeOperation({});
const confirmedFees = makeOperation({
  id: `${ACCOUNT_ID}-${HASH}-FEES`,
  type: "FEES",
  value: FEE,
  blockHash: "blockHash",
  blockHeight: 90,
});

const makeAccount = (overrides: Partial<Account>): Account => ({
  ...createFixtureAccount(),
  id: ACCOUNT_ID,
  freshAddress: "0xabc",
  currency: getCryptoCurrencyById("ethereum"),
  blockHeight: 1000,
  operations: [],
  pendingOperations: [],
  subAccounts: [],
  ...overrides,
});

const pendingAccount = makeAccount({ pendingOperations: [pendingOut] });
const syncedAccount = makeAccount({ operations: [confirmedFees] });

describe("OperationDetails when a sync replaces a pending EVM operation with a FEES one", () => {
  it("should render the confirmed operation when opened with the id of the replaced pending operation", async () => {
    render(<OperationDetails operationId={pendingOut.id} accountId={ACCOUNT_ID} />, {
      initialState: { accounts: [syncedAccount] },
    });

    expect(await screen.findByTestId("status-drawer")).toHaveTextContent("Confirmed");
  });

  it("should keep rendering the operation once the sync replaces the pending one", async () => {
    const { store } = render(
      <OperationDetails operationId={pendingOut.id} accountId={ACCOUNT_ID} />,
      { initialState: { accounts: [pendingAccount] } },
    );
    expect(await screen.findByTestId("status-drawer")).toHaveTextContent("Not confirmed");

    act(() => {
      store.dispatch(replaceAccounts([syncedAccount]));
    });

    expect(await screen.findByTestId("status-drawer")).toHaveTextContent("Confirmed");
  });
});
