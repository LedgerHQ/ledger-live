import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { Account, SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import { encodeAccountId } from "@ledgerhq/coin-framework/account";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { AptosAPI } from "../../api";
import { getAccountShape, mergeSubAccounts } from "../../bridge/synchronisation";
import BigNumber from "bignumber.js";
import { createFixtureAccount } from "../../bridge/bridge.fixture";

jest.mock("@ledgerhq/coin-framework/account", () => {
  const originalModule = jest.requireActual("@ledgerhq/coin-framework/account");
  const partialMockedModule = Object.keys(originalModule).reduce(
    (pre: { [key: string]: jest.Mock }, methodName) => {
      pre[methodName] = jest.fn();
      return pre;
    },
    {} as { [key: string]: jest.Mock },
  );
  return {
    ...partialMockedModule,
    // mock all except these
    decodeAccountId: originalModule.decodeAccountId,
  };
});

const mockedEncodeAccountId = jest.mocked(encodeAccountId);

jest.mock("../../api");
let mockedAptosAPI: jest.Mocked<any>;

jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers");
jest.mock("invariant", () => jest.fn());

describe("getAccountShape", () => {
  beforeEach(() => {
    mockedAptosAPI = jest.mocked(AptosAPI);
    jest.mocked(mergeOps).mockReturnValue([]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("account with xpub", async () => {
    const mockGetAccountInfo = jest.fn().mockImplementation(async () => ({
      balance: BigInt(0),
      transactions: [],
      blockHeight: 0,
    }));
    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
    }));
    const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

    const account = await getAccountShape(
      {
        id: "1",
        address: "address",
        currency: getCryptoCurrencyById("aptos"),
        derivationMode: "",
        index: 0,
        xpub: "address",
        derivationPath: "",
        deviceId: "1",
        initialAccount: {
          id: "1:1:1:1:aptos",
          xpub: "address",
          seedIdentifier: "1",
          derivationMode: "",
          index: 0,
          freshAddress: "address",
          freshAddressPath: "",
          used: true,
          balance: BigInt(10),
          spendableBalance: BigInt(10),
          creationDate: new Date(),
          blockHeight: 0,
          currency: getCryptoCurrencyById("aptos"),
          operationsCount: 0,
          operations: [],
          pendingOperations: [],
          lastSyncDate: new Date(),
          balanceHistoryCache: {},
          swapHistory: [],
        },
      } as unknown as AccountShapeInfo<Account>,
      {} as SyncConfig,
    );

    expect(account.xpub).toEqual("address");
    expect(mockedEncodeAccountId).toHaveBeenCalledTimes(1);
    expect(mockedAptosAPI).toHaveBeenCalledTimes(1);
    expect(mockGetAccountSpy).toHaveBeenCalledWith("address");
  });

  it("account without xpub", async () => {
    const mockGetAccountInfo = jest.fn().mockImplementation(async () => ({
      balance: BigInt(0),
      transactions: [],
      blockHeight: 0,
    }));
    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
    }));
    const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

    const account = await getAccountShape(
      {
        id: "1",
        address: "address",
        currency: getCryptoCurrencyById("aptos"),
        derivationMode: "",
        index: 0,
        xpub: "address",
        derivationPath: "",
        deviceId: "1",
        initialAccount: {
          id: "1:1:1:1:aptos",
          seedIdentifier: "1",
          derivationMode: "",
          index: 0,
          freshAddress: "address",
          freshAddressPath: "",
          used: true,
          balance: BigInt(10),
          spendableBalance: BigInt(10),
          creationDate: new Date(),
          blockHeight: 0,
          currency: getCryptoCurrencyById("aptos"),
          operationsCount: 0,
          operations: [],
          pendingOperations: [],
          lastSyncDate: new Date(),
          balanceHistoryCache: {},
          swapHistory: [],
        },
      } as unknown as AccountShapeInfo<Account>,
      {} as SyncConfig,
    );

    expect(account.xpub).toEqual("1");
    expect(mockedEncodeAccountId).toHaveBeenCalledTimes(1);
    expect(mockedAptosAPI).toHaveBeenCalledTimes(1);
    expect(mockGetAccountSpy).toHaveBeenCalledWith("address");
  });

  it("without initialAccount", async () => {
    const mockGetAccountInfo = jest.fn().mockImplementation(async () => ({
      balance: BigInt(0),
      transactions: [],
      blockHeight: 0,
    }));
    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
    }));
    const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

    const account = await getAccountShape(
      {
        id: "1",
        address: "address",
        currency: getCryptoCurrencyById("aptos"),
        derivationMode: "",
        index: 0,
        xpub: "address",
        derivationPath: "",
        deviceId: "1",
      } as unknown as AccountShapeInfo<Account>,
      {} as SyncConfig,
    );

    expect(account.xpub).toEqual("");
    expect(mockedEncodeAccountId).toHaveBeenCalledTimes(1);
    expect(mockedAptosAPI).toHaveBeenCalledTimes(1);
    expect(mockGetAccountSpy).toHaveBeenCalledWith("address");
  });

  it("initialAccount with operations", async () => {
    const mockGetAccountInfo = jest.fn().mockImplementation(async () => ({
      balance: BigInt(0),
      transactions: [],
      blockHeight: 0,
    }));
    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
    }));
    const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

    const account = await getAccountShape(
      {
        id: "1",
        address: "address",
        currency: getCryptoCurrencyById("aptos"),
        derivationMode: "",
        index: 0,
        xpub: "address",
        derivationPath: "",
        deviceId: "1",
        initialAccount: {
          id: "1:1:1:1:aptos",
          seedIdentifier: "1",
          derivationMode: "",
          index: 0,
          freshAddress: "address",
          freshAddressPath: "",
          used: true,
          balance: BigInt(10),
          spendableBalance: BigInt(10),
          creationDate: new Date(),
          blockHeight: 0,
          currency: getCryptoCurrencyById("aptos"),
          t: 1,
          operations: [
            {
              id: "1",
              hash: "hash",
              type: "OUT",
              value: BigInt(10),
              fee: BigInt(0),
              blockHeight: 0,
              blockHash: "blockHash",
              accountId: "1",
              senders: ["sender"],
              recipients: ["recipient"],
              date: new Date(),
            },
          ],
          pendingOperations: [],
          lastSyncDate: new Date(),
          balanceHistoryCache: {},
          swapHistory: [],
        },
      } as unknown as AccountShapeInfo<Account>,
      {} as SyncConfig,
    );

    expect(account.xpub).toEqual("1");
    expect(mockedEncodeAccountId).toHaveBeenCalledTimes(1);
    expect(mockedAptosAPI).toHaveBeenCalledTimes(1);
    expect(mockGetAccountSpy).toHaveBeenCalledWith("address");
  });

  it("initialAccount with operations with extra", async () => {
    const mockGetAccountInfo = jest.fn().mockImplementation(async () => ({
      balance: BigInt(0),
      transactions: [],
      blockHeight: 0,
    }));
    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
    }));
    const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

    const account = await getAccountShape(
      {
        id: "1",
        address: "address",
        currency: getCryptoCurrencyById("aptos"),
        derivationMode: "",
        index: 0,
        xpub: "address",
        derivationPath: "",
        deviceId: "1",
        initialAccount: {
          id: "1:1:1:1:aptos",
          seedIdentifier: "1",
          derivationMode: "",
          index: 0,
          freshAddress: "address",
          freshAddressPath: "",
          used: true,
          balance: BigInt(10),
          spendableBalance: BigInt(10),
          creationDate: new Date(),
          blockHeight: 0,
          currency: getCryptoCurrencyById("aptos"),
          t: 1,
          operations: [
            {
              id: "1",
              hash: "hash",
              type: "OUT",
              value: BigInt(10),
              fee: BigInt(0),
              blockHeight: 0,
              blockHash: "blockHash",
              accountId: "1",
              senders: ["sender"],
              recipients: ["recipient"],
              date: new Date(),
              extra: { version: 1 },
            },
          ],
          pendingOperations: [],
          lastSyncDate: new Date(),
          balanceHistoryCache: {},
          swapHistory: [],
        },
      } as unknown as AccountShapeInfo<Account>,
      {} as SyncConfig,
    );

    expect(account.xpub).toEqual("1");
    expect(mockedEncodeAccountId).toHaveBeenCalledTimes(1);
    expect(mockedAptosAPI).toHaveBeenCalledTimes(1);
    expect(mockGetAccountSpy).toHaveBeenCalledWith("address");
  });

  it("get publicKey from rest", async () => {
    const mockGetAccountInfo = jest.fn().mockImplementation(async () => ({
      balance: BigInt(0),
      transactions: [],
      blockHeight: 0,
    }));
    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
    }));
    const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

    const account = await getAccountShape(
      {
        id: "1",
        address: "address",
        currency: getCryptoCurrencyById("aptos"),
        derivationMode: "",
        index: 0,
        xpub: "address",
        derivationPath: "",
        deviceId: "1",
        initialAccount: {
          id: "1:1:1:1:aptos",
          seedIdentifier: "1",
          derivationMode: "",
          index: 0,
          freshAddress: "address",
          freshAddressPath: "",
          used: true,
          balance: BigInt(10),
          spendableBalance: BigInt(10),
          creationDate: new Date(),
          blockHeight: 0,
          currency: getCryptoCurrencyById("aptos"),
          t: 1,
          operations: [
            {
              id: "1",
              hash: "hash",
              type: "OUT",
              value: BigInt(10),
              fee: BigInt(0),
              blockHeight: 0,
              blockHash: "blockHash",
              accountId: "1",
              senders: ["sender"],
              recipients: ["recipient"],
              date: new Date(),
              extra: { version: 1 },
            },
          ],
          pendingOperations: [],
          lastSyncDate: new Date(),
          balanceHistoryCache: {},
          swapHistory: [],
        },
        rest: { publicKey: "restPublicKey" },
      } as unknown as AccountShapeInfo<Account>,
      {} as SyncConfig,
    );

    expect(account.xpub).toEqual("restPublicKey");
    expect(mockedEncodeAccountId).toHaveBeenCalledTimes(1);
    expect(mockedAptosAPI).toHaveBeenCalledTimes(1);
    expect(mockGetAccountSpy).toHaveBeenCalledWith("address");
  });
});

describe("mergeSubAccounts", () => {
  const subAccounts = [
    {
      type: "TokenAccount",
      id: "subAccountId",
      parentId: "accountId",
      token: {
        type: "TokenCurrency",
        id: "aptos/coin/dstapt_0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5::staked_coin::stakedaptos",
        contractAddress:
          "0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5::staked_coin::StakedAptos",
        parentCurrency: {
          type: "CryptoCurrency",
          id: "aptos",
          coinType: 637,
          name: "Aptos",
          managerAppName: "Aptos",
          ticker: "APT",
          scheme: "aptos",
          color: "#231F20",
          family: "aptos",
          units: [
            {
              name: "APT",
              code: "APT",
              magnitude: 8,
            },
          ],
          explorerViews: [
            {
              address: "https://explorer.aptoslabs.com/account/$address?network=mainnet",
              tx: "https://explorer.aptoslabs.com/txn/$hash?network=mainnet",
            },
          ],
        },
        name: "dstAPT",
        tokenType: "coin",
        ticker: "dstAPT",
        disableCountervalue: false,
        delisted: false,
        units: [
          {
            name: "dstAPT",
            code: "dstAPT",
            magnitude: 8,
          },
        ],
      },
      balance: BigNumber(100),
      spendableBalance: BigNumber(100),
      creationDate: new Date(),
      operationsCount: 0,
      operations: [],
      pendingOperations: [],
      balanceHistoryCache: emptyHistoryCache,
      swapHistory: [],
    },
  ] as TokenAccount[];

  it("return new subAccount if no old subAccounts", () => {
    expect(mergeSubAccounts(undefined, subAccounts)).toEqual(subAccounts);
  });

  it("merge subAccounts properly if initialAccount has the same as new subAccounts", () => {
    const initialAccount = createFixtureAccount({
      subAccounts,
    });
    expect(mergeSubAccounts(initialAccount, subAccounts)).toEqual(subAccounts);
  });
});
