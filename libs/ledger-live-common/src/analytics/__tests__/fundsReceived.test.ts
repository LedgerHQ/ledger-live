import BigNumber from "bignumber.js";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCryptoCurrencyById } from "../../currencies/index";
import {
  buildReceiveOperationsSnapshot,
  findNewlyReceivedOperations,
  getFundsReceivedTrackingProperties,
} from "../fundsReceived";

const eth = getCryptoCurrencyById("ethereum");

const usdt: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("ethereum/erc20/usd_tether__erc20_"),
  parentCurrencyId: eth.id,
  tokenType: "erc20",
  name: "Tether USD",
  ticker: "USDT",
  contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
  disableCountervalue: false,
};

const ethAccountId = "js:2:ethereum:0xabc:";
const tokenAccountId = `${ethAccountId}+${usdt.id}`;

const createReceiveOperation = ({
  accountId,
  hash,
}: {
  accountId: string;
  hash: string;
}): Operation => ({
  id: encodeOperationId(accountId, hash, "IN"),
  hash,
  type: "IN",
  value: new BigNumber(1),
  fee: new BigNumber(0),
  senders: ["0xsender"],
  recipients: ["0xrecipient"],
  accountId,
  date: new Date("2024-01-01T00:00:00.000Z"),
  blockHeight: 1,
  blockHash: null,
  transactionSequenceNumber: new BigNumber(1),
  hasFailed: false,
  extra: {},
});

const ethReceiveOperation = createReceiveOperation({
  accountId: ethAccountId,
  hash: "eth-receive-hash",
});

const tokenReceiveOperation = createReceiveOperation({
  accountId: tokenAccountId,
  hash: "token-receive-hash",
});

const tokenAccount: TokenAccount = {
  type: "TokenAccount",
  id: tokenAccountId,
  parentId: ethAccountId,
  token: usdt,
  balance: new BigNumber(1),
  spendableBalance: new BigNumber(1),
  creationDate: new Date("2024-01-01T00:00:00.000Z"),
  operationsCount: 1,
  operations: [tokenReceiveOperation],
  pendingOperations: [],
  balanceHistoryCache: {
    HOUR: { balances: [], latestDate: 0 },
    DAY: { balances: [], latestDate: 0 },
    WEEK: { balances: [], latestDate: 0 },
  },
  swapHistory: [],
};

const ethAccount: Account = {
  type: "Account",
  id: ethAccountId,
  used: true,
  seedIdentifier: "seed",
  derivationMode: "",
  index: 0,
  freshAddress: "0xabc",
  freshAddressPath: "44'/60'/0'/0/0",
  blockHeight: 1,
  creationDate: new Date("2024-01-01T00:00:00.000Z"),
  balance: new BigNumber(1),
  spendableBalance: new BigNumber(1),
  operations: [ethReceiveOperation],
  operationsCount: 1,
  pendingOperations: [],
  currency: eth,
  lastSyncDate: new Date("2024-01-01T00:00:00.000Z"),
  swapHistory: [],
  balanceHistoryCache: {
    HOUR: { balances: [], latestDate: 0 },
    DAY: { balances: [], latestDate: 0 },
    WEEK: { balances: [], latestDate: 0 },
  },
  subAccounts: [tokenAccount],
};

describe("fundsReceived analytics helpers", () => {
  it("returns asset and network for native and token accounts", () => {
    expect(getFundsReceivedTrackingProperties(ethAccount)).toEqual({
      asset: "Ethereum",
      network: "Ethereum",
    });
    expect(getFundsReceivedTrackingProperties(tokenAccount)).toEqual({
      asset: "Tether USD",
      network: "Ethereum",
    });
  });

  it("builds a snapshot of receive operation ids per account", () => {
    const snapshot = buildReceiveOperationsSnapshot([ethAccount]);

    expect(snapshot.get(ethAccountId)).toEqual(new Set([ethReceiveOperation.id]));
    expect(snapshot.get(tokenAccountId)).toEqual(new Set([tokenReceiveOperation.id]));
  });

  it("does not report operations on first snapshot", () => {
    expect(findNewlyReceivedOperations([ethAccount], null)).toEqual([]);
  });

  it("reports only new receive operations on existing accounts", () => {
    const previousSnapshot = buildReceiveOperationsSnapshot([ethAccount]);
    const newEthReceiveOperation = createReceiveOperation({
      accountId: ethAccountId,
      hash: "new-eth-receive-hash",
    });
    const updatedAccounts: Account[] = [
      {
        ...ethAccount,
        operations: [ethReceiveOperation, newEthReceiveOperation],
        operationsCount: 2,
      },
    ];

    expect(findNewlyReceivedOperations(updatedAccounts, previousSnapshot)).toEqual([
      {
        account: expect.objectContaining({ id: ethAccountId }),
        operation: newEthReceiveOperation,
      },
    ]);
  });

  it("does not report historical receive operations when a new account is added", () => {
    const previousSnapshot = buildReceiveOperationsSnapshot([]);
    const newAccountWithHistory: Account[] = [ethAccount];

    expect(findNewlyReceivedOperations(newAccountWithHistory, previousSnapshot)).toEqual([]);
  });

  it("ignores failed and non-IN operations", () => {
    const failedReceiveOperation: Operation = {
      ...ethReceiveOperation,
      id: encodeOperationId(ethAccountId, "failed-receive", "IN"),
      hash: "failed-receive",
      hasFailed: true,
    };
    const outOperation: Operation = {
      ...ethReceiveOperation,
      id: encodeOperationId(ethAccountId, "outgoing", "OUT"),
      hash: "outgoing",
      type: "OUT",
    };
    const accountWithMixedOperations: Account = {
      ...ethAccount,
      operations: [failedReceiveOperation, outOperation],
      operationsCount: 2,
    };
    const previousSnapshot = buildReceiveOperationsSnapshot([
      { ...ethAccount, operations: [], operationsCount: 0, subAccounts: [] },
    ]);

    expect(findNewlyReceivedOperations([accountWithMixedOperations], previousSnapshot)).toEqual([]);
  });
});
