import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { getBridgeApi } from "@ledgerhq/live-common/bridge/generic-coin-framework/bridge";
import { importLLDCoinFamily } from "~/renderer/families";
import { OperationDetails } from "..";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ isEditableOperation: () => false, isStuckOperation: () => false }),
}));

jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/bridge", () => ({
  getBridgeApi: jest.fn(),
}));
const mockGetBridgeApi = jest.mocked(getBridgeApi);

// The currency and value each counter-value is computed from.
jest.mock("~/renderer/components/CounterValue", () => ({
  __esModule: true,
  default: ({ currency, value }: { currency: { id: string }; value: BigNumber }) => (
    <span>{`countervalue ${currency.id} ${value.toFixed()}`}</span>
  ),
}));

beforeAll(async () => {
  await importLLDCoinFamily("evm");
});

beforeEach(() => {
  mockGetBridgeApi.mockReset();
  mockGetBridgeApi.mockResolvedValue({ getTokenFromAsset: async () => undefined });
});

const ethereum = getCryptoCurrencyById("ethereum");
const CONTRACT = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const usdc: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
  contractAddress: CONTRACT,
  parentCurrencyId: ethereum.id,
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
};

const ACCOUNT_ID = "js:2:ethereum:0xabc:";
const TOKEN_ACCOUNT_ID = `${ACCOUNT_ID}+ethereum%2Ferc20%2Fusd__coin`;
// A fee of 0.001601 USDC, paid by the account
const feeExtra = {
  feeAsset: { type: "erc20", assetReference: CONTRACT },
  feeAmount: "1601",
  feePayer: "0xabc",
};

const baseOperation = {
  hash: "0xhash",
  senders: ["0xabc"],
  recipients: ["0xdef"],
  blockHash: "hash",
  blockHeight: 90,
  date: new Date(),
};

// The native operation of the transaction: its fee is out of `fee`, in `extra`
const nativeOperation = {
  ...baseOperation,
  id: `${ACCOUNT_ID}-0xhash-OUT`,
  accountId: ACCOUNT_ID,
  type: "OUT",
  value: new BigNumber(1000),
  fee: new BigNumber(0),
  extra: feeExtra,
} as unknown as Operation;

// The fee charged in the token's sub-account
const feesOperation = {
  ...baseOperation,
  id: `${TOKEN_ACCOUNT_ID}-0xhash-FEES`,
  accountId: TOKEN_ACCOUNT_ID,
  type: "FEES",
  value: new BigNumber(1601),
  fee: new BigNumber(1601),
  recipients: [],
  extra: { ...feeExtra, ledgerOpType: "FEES", assetReference: CONTRACT, assetOwner: "0xabc" },
} as unknown as Operation;

// A transaction that paid its fee in the native coin
const nativeFeeOperation = {
  ...baseOperation,
  id: `${ACCOUNT_ID}-0xnative-OUT`,
  hash: "0xnative",
  accountId: ACCOUNT_ID,
  type: "OUT",
  value: new BigNumber("1000000000000000"),
  fee: new BigNumber("21000000000000"),
  extra: {},
} as unknown as Operation;

const tokenAccount = {
  type: "TokenAccount",
  id: TOKEN_ACCOUNT_ID,
  parentId: ACCOUNT_ID,
  token: usdc,
  balance: new BigNumber(1_000_000),
  spendableBalance: new BigNumber(1_000_000),
  creationDate: new Date(),
  operationsCount: 1,
  operations: [feesOperation],
  pendingOperations: [],
  swapHistory: [],
} as unknown as TokenAccount;

const accountWith = (subAccounts: TokenAccount[]): Account =>
  ({
    ...createFixtureAccount(),
    id: ACCOUNT_ID,
    freshAddress: "0xabc",
    currency: ethereum,
    blockHeight: 1000,
    operations: [nativeOperation, nativeFeeOperation],
    pendingOperations: [],
    subAccounts,
  }) as unknown as Account;

const renderDrawer = (
  account: Account,
  operationId: string,
  accountId = ACCOUNT_ID,
  parentId?: string,
) =>
  render(<OperationDetails operationId={operationId} accountId={accountId} parentId={parentId} />, {
    initialState: { accounts: [account] },
  });

describe("OperationDetails fee paid in a token", () => {
  it("shows the fee of a FEES operation of a token account in that token", async () => {
    renderDrawer(accountWith([tokenAccount]), feesOperation.id, TOKEN_ACCOUNT_ID, ACCOUNT_ID);

    await screen.findByTestId("status-drawer");
    expect(screen.getByText("Fee")).toBeInTheDocument();
    expect(screen.getAllByText(/0\.001601\s*USDC/).length).toBeGreaterThan(0);
    expect(screen.getByText(`countervalue ${usdc.id} 1601`)).toBeInTheDocument();
    expect(screen.queryByText(/ETH$/)).not.toBeInTheDocument();
  });

  it("shows the fee of the native operation in the token, read from the operation", async () => {
    renderDrawer(accountWith([tokenAccount]), nativeOperation.id);

    await screen.findByTestId("status-drawer");
    expect(screen.getByText("Fee")).toBeInTheDocument();
    expect(screen.getByText(/0\.001601\s*USDC/)).toBeInTheDocument();
    expect(screen.getByText(`countervalue ${usdc.id} 1601`)).toBeInTheDocument();
    expect(mockGetBridgeApi).not.toHaveBeenCalled();
  });

  it("resolves the token of a fee no sub-account was charged with", async () => {
    mockGetBridgeApi.mockResolvedValue({ getTokenFromAsset: async () => usdc });

    renderDrawer(accountWith([]), nativeOperation.id);

    expect(await screen.findByText(/0\.001601\s*USDC/)).toBeInTheDocument();
    expect(screen.getByText(`countervalue ${usdc.id} 1601`)).toBeInTheDocument();
  });

  it("shows no fee while its token is unresolved, rather than one in ETH", async () => {
    renderDrawer(accountWith([]), nativeOperation.id);

    await screen.findByTestId("status-drawer");
    expect(screen.queryByText("Fee")).not.toBeInTheDocument();
    expect(screen.queryByText(`countervalue ${ethereum.id} 0`)).not.toBeInTheDocument();
  });

  it("shows a native fee in the native coin, as before", async () => {
    renderDrawer(accountWith([tokenAccount]), nativeFeeOperation.id);

    await screen.findByTestId("status-drawer");
    expect(screen.getByText("Fee")).toBeInTheDocument();
    expect(screen.getByText(/0\.000021\s*ETH/)).toBeInTheDocument();
    expect(screen.getByText(`countervalue ${ethereum.id} 21000000000000`)).toBeInTheDocument();
    expect(mockGetBridgeApi).not.toHaveBeenCalled();
  });

  it("shows the fee of a fee-only native operation in the token", async () => {
    mockGetBridgeApi.mockResolvedValue({ getTokenFromAsset: async () => usdc });
    const carrier = {
      ...nativeOperation,
      id: `${ACCOUNT_ID}-0xhash-NONE`,
      type: "NONE",
      value: new BigNumber(0),
    } as Operation;
    const account = { ...accountWith([]), operations: [carrier] };

    renderDrawer(account, carrier.id);

    expect(await screen.findByText(/0\.001601\s*USDC/)).toBeInTheDocument();
    expect(screen.getByText(`countervalue ${usdc.id} 1601`)).toBeInTheDocument();
  });

  it("shows the fee of a pending operation in the native coin, as before", async () => {
    // As the generic bridge builds it before the broadcast: no hash, no block, no fee asset
    const pending = {
      ...nativeFeeOperation,
      id: `${ACCOUNT_ID}--OUT`,
      hash: "",
      blockHash: null,
      blockHeight: null,
      extra: { ledgerOpType: "OUT", blockTime: new Date(), index: "0" },
    } as Operation;
    const account = { ...accountWith([tokenAccount]), pendingOperations: [pending] };

    renderDrawer(account, pending.id);

    await screen.findByTestId("status-drawer");
    expect(screen.getByText(/0\.000021\s*ETH/)).toBeInTheDocument();
    expect(screen.getByText(`countervalue ${ethereum.id} 21000000000000`)).toBeInTheDocument();
  });
});
