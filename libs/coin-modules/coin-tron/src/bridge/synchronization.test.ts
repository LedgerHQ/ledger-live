import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { makeScanAccounts } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { firstValueFrom } from "rxjs";
import coinConfig from "../config";
import {
  fetchTronAccount,
  fetchTronAccountTxs,
  getLastBlock,
  getTronAccountNetwork,
  getUnwithdrawnReward,
} from "../network";
import { AccountTronAPI } from "../network/types";
import { TronAccount, TrongridTxInfo, TronOperation } from "../types";
import type { NetworkInfo } from "../types/bridge";
import { getAccountShape, postSync } from "./synchronization";

jest.mock("../network", () => ({
  fetchTronAccount: jest.fn(),
  fetchTronAccountTxs: jest.fn(),
  getLastBlock: jest.fn(),
  getTronAccountNetwork: jest.fn(),
  getUnwithdrawnReward: jest.fn(),
  accountNamesCache: jest.fn(async () => undefined),
  defaultFetchParams: { limitPerCall: 100, minTimestamp: 0, order: "desc" },
}));

const mockedFetchTronAccount = fetchTronAccount as jest.MockedFunction<typeof fetchTronAccount>;
const mockedFetchTronAccountTxs = fetchTronAccountTxs as jest.MockedFunction<
  typeof fetchTronAccountTxs
>;
const mockedGetLastBlock = getLastBlock as jest.MockedFunction<typeof getLastBlock>;
const mockedGetTronAccountNetwork = getTronAccountNetwork as jest.MockedFunction<
  typeof getTronAccountNetwork
>;
const mockedGetUnwithdrawnReward = getUnwithdrawnReward as jest.MockedFunction<
  typeof getUnwithdrawnReward
>;

const currency = getCryptoCurrencyById("tron");

const TRC10_ID = "tron/trc10/1002000";
const TRC20_ID = "tron/trc20/tla2f6vpqdgre67v1736s7bj8ray5wyju7";
const TRC20_CONTRACT = "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7";

const parentCurrency = {
  type: "CryptoCurrency",
  id: "tron",
  coinType: 195,
  name: "Tron",
  managerAppName: "Tron",
  ticker: "TRX",
  scheme: "tron",
  color: "#D9012C",
  family: "tron",
  blockAvgTime: 9,
  units: [{ name: "TRX", code: "TRX", magnitude: 6 }],
  explorerViews: [
    { tx: "https://tronscan.org/#/transaction/$hash", address: "https://tronscan.org/#/address/$address" },
  ],
  keywords: ["trx", "tron"],
};

const mockTokens: Record<string, TokenCurrency> = {
  [TRC10_ID]: {
    type: "TokenCurrency",
    id: TRC10_ID,
    contractAddress: "TF5Bn4cJCT6GVeUgyCN4rBhDg42KBrpAjg",
    parentCurrency: parentCurrency as TokenCurrency["parentCurrency"],
    tokenType: "trc10",
    name: "BitTorrent Old",
    ticker: "BTTOLD",
    delisted: true,
    disableCountervalue: false,
    ledgerSignature: "",
    units: [{ name: "BitTorrent Old", code: "BTTOLD", magnitude: 6 }],
  } as TokenCurrency,
  [TRC20_ID]: {
    type: "TokenCurrency",
    id: TRC20_ID,
    contractAddress: TRC20_CONTRACT,
    parentCurrency: parentCurrency as TokenCurrency["parentCurrency"],
    tokenType: "trc20",
    name: "WINK",
    ticker: "WIN",
    delisted: false,
    disableCountervalue: false,
    ledgerSignature: undefined,
    units: [{ name: "WINK", code: "WIN", magnitude: 6 }],
  } as TokenCurrency,
};

function installCryptoAssetsStore() {
  setupMockCryptoAssetsStore({
    findTokenById: async (id: string) => mockTokens[id],
    findTokenByAddressInCurrency: async (address: string, currencyId: string) => {
      if (currencyId !== "tron") return undefined;
      return Object.values(mockTokens).find(
        token => token.contractAddress.toLowerCase() === address.toLowerCase(),
      );
    },
  });
}

const address = "TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre";

const makeTx = (overrides: Partial<TrongridTxInfo>): TrongridTxInfo => ({
  txID: "tx-id",
  date: new Date("2024-01-01T00:00:00Z"),
  type: "TransferContract",
  from: "other",
  to: address,
  value: new BigNumber(1000),
  fee: new BigNumber(0),
  blockHeight: 1,
  hasFailed: false,
  ...overrides,
});

const baseNetworkInfo: NetworkInfo = {
  family: "tron",
  freeNetUsed: new BigNumber(0),
  freeNetLimit: new BigNumber(600),
  netUsed: new BigNumber(0),
  netLimit: new BigNumber(0),
  energyUsed: new BigNumber(0),
  energyLimit: new BigNumber(0),
};

beforeAll(() => {
  installCryptoAssetsStore();
  coinConfig.setCoinConfig(() => ({
    status: { type: "active" },
    explorer: { url: "https://api.mock.trongrid.io" },
  }));
});

beforeEach(() => {
  mockedFetchTronAccount.mockReset();
  mockedFetchTronAccountTxs.mockReset();
  mockedGetLastBlock.mockReset();
  mockedGetTronAccountNetwork.mockReset();
  mockedGetUnwithdrawnReward.mockReset();

  mockedGetLastBlock.mockResolvedValue({ height: 100, hash: "block-hash", time: new Date(0) });
  mockedGetTronAccountNetwork.mockResolvedValue(baseNetworkInfo);
  mockedGetUnwithdrawnReward.mockResolvedValue(new BigNumber(0));
  mockedFetchTronAccountTxs.mockResolvedValue([]);
});

describe("getAccountShape", () => {
  it("returns a default empty shape when no tron account is found", async () => {
    mockedFetchTronAccount.mockResolvedValueOnce([]);

    const shape = await getAccountShape(
      {
        currency,
        address,
        derivationMode: "",
        index: 0,
        rest: {},
      } as Parameters<typeof getAccountShape>[0],
      { paginationConfig: {} },
    );

    expect(shape.id).toEqual(`js:2:tron:${address}:`);
    expect(shape.blockHeight).toEqual(100);
    expect(shape.balance).toEqual(new BigNumber(0));
  });

  it("returns a populated shape with trc10/trc20 sub accounts and parent operations", async () => {
    const acc: AccountTronAPI = {
      address,
      balance: 5_000_000,
      assetV2: [{ key: "1002000", value: 26_888_000 }],
      trc20: [{ [TRC20_CONTRACT]: "46825830" }],
    };
    mockedFetchTronAccount.mockResolvedValueOnce([acc]);

    const parentOp = makeTx({
      txID: "tx-parent",
      type: "TransferContract",
      from: address,
      to: "recipient",
      value: new BigNumber(1000),
    });
    const trc10Op = makeTx({
      txID: "tx-trc10",
      type: "TransferAssetContract",
      tokenId: "1002000",
      from: address,
      to: "recipient",
      value: new BigNumber(50),
      fee: new BigNumber(10),
    });
    const trc20Op = makeTx({
      txID: "tx-trc20",
      type: "TriggerSmartContract",
      tokenId: TRC20_CONTRACT,
      from: address,
      to: "recipient",
      value: new BigNumber(20),
      fee: new BigNumber(5),
    });
    mockedFetchTronAccountTxs.mockImplementationOnce(async (_addr, predicate) => {
      const txs = [parentOp, trc10Op, trc20Op];
      predicate([]);
      return txs;
    });

    const shape = await getAccountShape(
      {
        currency,
        address,
        derivationMode: "",
        index: 0,
        rest: {},
      } as Parameters<typeof getAccountShape>[0],
      { paginationConfig: {} },
    );

    expect(shape.id).toEqual(`js:2:tron:${address}:`);
    expect(shape.balance).toEqual(new BigNumber(5_000_000));
    expect(shape.subAccounts).toHaveLength(2);
    expect(shape.subAccounts?.map(s => s.token.id)).toEqual([TRC10_ID, TRC20_ID]);
    expect(shape.operations).toHaveLength(3);
    expect(shape.used).toBe(true);
  });

  it("excludes blacklisted tokens and tokens unknown to the assets store", async () => {
    const acc: AccountTronAPI = {
      address,
      balance: 0,
      assetV2: [
        { key: "1002000", value: 26_888_000 },
        { key: "unknown-trc10", value: 1 },
      ],
      trc20: [{ [TRC20_CONTRACT]: "10" }, { TUnknownContract: "5" }],
    };
    mockedFetchTronAccount.mockResolvedValueOnce([acc]);

    const shape = await getAccountShape(
      {
        currency,
        address,
        derivationMode: "",
        index: 0,
        rest: {},
      } as Parameters<typeof getAccountShape>[0],
      { paginationConfig: {}, blacklistedTokenIds: [TRC10_ID] },
    );

    expect(shape.subAccounts).toHaveLength(1);
    expect(shape.subAccounts?.[0].token.id).toEqual(TRC20_ID);
  });

  it("merges initialAccount.subAccounts (zeroing balances of unknown ones, filtering blacklist)", async () => {
    const acc: AccountTronAPI = {
      address,
      balance: 0,
      trc20: [{ [TRC20_CONTRACT]: "10" }],
    };
    mockedFetchTronAccount.mockResolvedValueOnce([acc]);

    const initialAccountId = `js:2:tron:${address}:`;
    const oldTokenAccountId = encodeTokenAccountId(initialAccountId, {
      id: "tron/trc20/old-removed",
    } as TokenCurrency);
    const blacklistedAccountId = encodeTokenAccountId(initialAccountId, {
      id: TRC10_ID,
    } as TokenCurrency);
    const existingTrc20Id = encodeTokenAccountId(initialAccountId, mockTokens[TRC20_ID]);

    const initialAccount = {
      id: initialAccountId,
      subAccounts: [
        {
          id: existingTrc20Id,
          type: "TokenAccount",
          token: { id: TRC20_ID } as TokenCurrency,
          balance: new BigNumber(999),
          spendableBalance: new BigNumber(999),
          operationsCount: 0,
          operations: [],
          pendingOperations: [{ id: "pending-1" } as TronOperation],
          swapHistory: [{ provider: "provider-x" } as never],
          balanceHistoryCache: {},
          creationDate: new Date(),
        },
        {
          id: oldTokenAccountId,
          type: "TokenAccount",
          token: { id: "tron/trc20/old-removed" } as TokenCurrency,
          balance: new BigNumber(42),
          spendableBalance: new BigNumber(42),
          operationsCount: 0,
          operations: [],
          pendingOperations: [],
          swapHistory: [],
          balanceHistoryCache: {},
          creationDate: new Date(),
        },
        {
          id: blacklistedAccountId,
          type: "TokenAccount",
          token: { id: TRC10_ID } as TokenCurrency,
          balance: new BigNumber(7),
          spendableBalance: new BigNumber(7),
          operationsCount: 0,
          operations: [],
          pendingOperations: [],
          swapHistory: [],
          balanceHistoryCache: {},
          creationDate: new Date(),
        },
      ],
    };

    const shape = await getAccountShape(
      {
        currency,
        address,
        derivationMode: "",
        index: 0,
        rest: {},
        initialAccount,
      } as unknown as Parameters<typeof getAccountShape>[0],
      { paginationConfig: {}, blacklistedTokenIds: [TRC10_ID] },
    );

    expect(shape.subAccounts).toHaveLength(2);
    const newTrc20 = shape.subAccounts?.find(s => s.id === existingTrc20Id);
    expect(newTrc20?.pendingOperations).toEqual([{ id: "pending-1" }]);
    expect(newTrc20?.swapHistory).toEqual([{ provider: "provider-x" }]);

    const reusedOld = shape.subAccounts?.find(s => s.id === oldTokenAccountId);
    expect(reusedOld?.balance).toEqual(new BigNumber(0));
    expect(reusedOld?.spendableBalance).toEqual(new BigNumber(0));

    expect(shape.subAccounts?.find(s => s.id === blacklistedAccountId)).toBeUndefined();
  });

  it("derives OUT subaccount operations with fee into parent operations", async () => {
    const acc: AccountTronAPI = {
      address,
      balance: 1_000_000,
      trc20: [{ [TRC20_CONTRACT]: "1000" }],
    };
    mockedFetchTronAccount.mockResolvedValueOnce([acc]);

    const trc20OutWithFee = makeTx({
      txID: "tx-out-fee",
      type: "TriggerSmartContract",
      tokenId: TRC20_CONTRACT,
      from: address,
      to: "recipient",
      value: new BigNumber(20),
      fee: new BigNumber(123),
    });
    const trc20InNoFee = makeTx({
      txID: "tx-in-nofee",
      type: "TriggerSmartContract",
      tokenId: TRC20_CONTRACT,
      from: "sender",
      to: address,
      value: new BigNumber(10),
      fee: new BigNumber(0),
    });
    mockedFetchTronAccountTxs.mockResolvedValueOnce([trc20OutWithFee, trc20InNoFee]);

    const shape = await getAccountShape(
      {
        currency,
        address,
        derivationMode: "",
        index: 0,
        rest: {},
      } as Parameters<typeof getAccountShape>[0],
      { paginationConfig: {} },
    );

    const feeOps = shape.operations?.filter(o => o.type === "OUT");
    expect(feeOps).toHaveLength(1);
    expect(feeOps?.[0].value).toEqual(new BigNumber(123));
  });
});

describe("postSync", () => {
  const buildAccount = (overrides: Partial<TronAccount> = {}): TronAccount =>
    ({
      type: "Account",
      id: "id",
      blockHeight: 100,
      operations: [],
      pendingOperations: [],
      subAccounts: [],
      ...overrides,
    }) as TronAccount;

  it("evicts a confirmed operation when block diff is below threshold", () => {
    const op = { id: "op-1", blockHeight: 90 } as TronOperation;
    const account = buildAccount({
      blockHeight: 100,
      operations: [op],
      pendingOperations: [op],
    });

    const result = postSync(account, account);
    expect(result.operations).toEqual([]);
  });

  it("keeps the operation when block diff exceeds threshold", () => {
    const op = { id: "op-1", blockHeight: 50 } as TronOperation;
    const account = buildAccount({
      blockHeight: 100,
      operations: [op],
      pendingOperations: [op],
    });

    const result = postSync(account, account);
    expect(result.operations).toEqual([op]);
  });

  it("treats a missing blockHeight on the confirmed op as 0", () => {
    const op = { id: "op-1" } as TronOperation;
    const account = buildAccount({
      blockHeight: 10,
      operations: [op],
      pendingOperations: [op],
    });

    const result = postSync(account, account);
    expect(result.operations).toEqual([]);
  });

  it("ignores pending operations that have no matching confirmed op", () => {
    const op = { id: "real-op", blockHeight: 90 } as TronOperation;
    const account = buildAccount({
      blockHeight: 100,
      operations: [op],
      pendingOperations: [{ id: "unmatched" } as TronOperation],
    });

    expect(postSync(account, account).operations).toEqual([op]);
  });

  it("applies eviction to subAccounts as well", () => {
    const op = { id: "sub-op", blockHeight: 95 } as TronOperation;
    const account = buildAccount({
      blockHeight: 100,
      subAccounts: [
        {
          type: "TokenAccount",
          id: "sub-id",
          operations: [op],
          pendingOperations: [op],
        } as never,
      ],
    });

    const result = postSync(account, account);
    expect(result.subAccounts?.[0].operations).toEqual([]);
  });

  it("handles accounts without subAccounts", () => {
    const account = buildAccount({ subAccounts: undefined });
    expect(postSync(account, account)).toBe(account);
  });
});

describe("scanAccounts", () => {
  it.each([
    { freeNetLimit: new BigNumber(0), expectedUsed: false },
    { freeNetLimit: new BigNumber(100), expectedUsed: true },
  ])("returns an account flagged as used=$expectedUsed", async ({ freeNetLimit, expectedUsed }) => {
    mockedGetTronAccountNetwork.mockReset();
    mockedGetTronAccountNetwork.mockResolvedValueOnce({
      ...baseNetworkInfo,
      freeNetLimit,
    });
    mockedFetchTronAccount.mockResolvedValueOnce([
      { address: "TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N", trc20: [] } as AccountTronAPI,
    ]);

    const scanAccounts = makeScanAccounts({
      getAccountShape,
      getAddressFn: () =>
        Promise.resolve({
          address: "TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N",
          path: "path",
          publicKey: "publicKey",
        }),
    });
    const { account } = await firstValueFrom(
      scanAccounts({
        currency,
        deviceId: "",
        syncConfig: { paginationConfig: {} },
      }),
    );

    expect(account.used).toEqual(expectedUsed);
  });
});
