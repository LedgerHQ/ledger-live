import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { Account, SyncConfig } from "@ledgerhq/types-live";
import { encodeAccountId } from "@ledgerhq/coin-framework/account";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AptosAPI } from "../../api";
import { getAccountShape } from "../../bridge/synchronisation";

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
          id: "1:1:1:1:1",
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
    expect(mockGetAccountSpy).toHaveBeenCalledWith("address", undefined);
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
          id: "1:1:1:1:1",
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
    expect(mockGetAccountSpy).toHaveBeenCalledWith("address", undefined);
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
    expect(mockGetAccountSpy).toHaveBeenCalledWith("address", undefined);
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
          id: "1:1:1:1:1",
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
    expect(mockGetAccountSpy).toHaveBeenCalledWith("address", undefined);
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
          id: "1:1:1:1:1",
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
    expect(mockGetAccountSpy).toHaveBeenCalledWith("address", 1);
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
          id: "1:1:1:1:1",
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
    expect(mockGetAccountSpy).toHaveBeenCalledWith("address", 1);
  });
});
