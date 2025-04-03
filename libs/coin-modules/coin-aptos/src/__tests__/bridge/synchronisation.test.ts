import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { Account, Operation, SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import { encodeAccountId, decodeTokenAccountId } from "@ledgerhq/coin-framework/account";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { AptosAPI } from "../../api";
import {
  getAccountShape,
  mergeSubAccounts,
  getSubAccountShape,
  getSubAccounts,
} from "../../bridge/synchronisation";
import BigNumber from "bignumber.js";
import { createFixtureAccount } from "../../bridge/bridge.fixture";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

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
    encodeTokenAccountId: originalModule.encodeTokenAccountId,
  };
});

const mockedEncodeAccountId = jest.mocked(encodeAccountId);
const mockedDecodeTokenAccountId = jest.mocked(decodeTokenAccountId);

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
  const initialSubAccount = {
    type: "TokenAccount",
    id: "subAccountId",
    parentId: "accountId",
    token: {
      type: "TokenCurrency",
      id: "aptos/coin/dstapt_0xd111::staked_coin::stakedaptos",
      contractAddress: "0xd111::staked_coin::StakedAptos",
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
  } as TokenAccount;

  const initialAccount = createFixtureAccount({
    subAccounts: [initialSubAccount],
  });

  it("return new subAccount if no old subAccounts", () => {
    expect(mergeSubAccounts(undefined, [initialSubAccount])).toEqual([initialSubAccount]);
  });

  it("merge subAccounts properly if initialAccount has the same as new subAccounts", () => {
    expect(mergeSubAccounts(initialAccount, [initialSubAccount])).toEqual([initialSubAccount]);
  });

  it("adds new sub account to initialAccount properly", () => {
    const newSubAccount = {
      type: "TokenAccount",
      id: "js:2:aptos:474d:aptos+aptos%2Ffungible~!underscore!~asset%2Fcellana~!underscore!~0x2ebb",
      parentId: "js:2:aptos:474d:aptos",
      token: {
        type: "TokenCurrency",
        id: "aptos/fungible_asset/cellana_0x2ebb",
        contractAddress: "0x2ebb",
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
        name: "CELLANA",
        tokenType: "fungible_asset",
        ticker: "CELL",
        disableCountervalue: false,
        delisted: false,
        units: [
          {
            name: "CELLANA",
            code: "CELL",
            magnitude: 8,
          },
        ],
      },
      balance: BigNumber(22980368),
      spendableBalance: BigNumber(22980368),
      creationDate: new Date(),
      operationsCount: 0,
      operations: [],
      pendingOperations: [],
      swapHistory: [],
      balanceHistoryCache: emptyHistoryCache,
    } as TokenAccount;
    expect(mergeSubAccounts(initialAccount, [newSubAccount])).toEqual([
      initialSubAccount,
      newSubAccount,
    ]);
  });

  it("merge subAccounts properly when new subAccounts is different", () => {
    expect(
      mergeSubAccounts(initialAccount, [{ ...initialSubAccount, balance: BigNumber(150) }]),
    ).toEqual([{ ...initialSubAccount, balance: BigNumber(150) }]);
  });
});

describe("getSubAccountShape", () => {
  beforeEach(() => {
    mockedAptosAPI = jest.mocked(AptosAPI);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const currency = {
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
  } as CryptoCurrency;
  const address = "0xa0d8";
  const parentId = "js:2:aptos:474d:aptos";
  const token = {
    type: "TokenCurrency",
    id: "aptos/coin/dstapt_0xd111::staked_coin::stakedaptos",
    contractAddress: "0xd111::staked_coin::StakedAptos",
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
  } as TokenCurrency;
  const firstOperationDate = new Date(10);
  const operations = [
    {
      id: "js:2:aptos:474d:aptos-0x2011-IN",
      hash: "0x2011",
      type: "IN",
      value: BigNumber(2000000),
      fee: BigNumber(1200),
      blockHash: "0xf29363a5a78d784c702a8ea352ac3e1461092cc2347b305adcace14aa7b15d60",
      blockHeight: 315151047,
      senders: ["0x4e5e"],
      recipients: ["0xa0d8"],
      accountId:
        "js:2:aptos:474d:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
      date: new Date(1000),
      extra: {
        version: "2553182323",
      },
      transactionSequenceNumber: 32,
      hasFailed: false,
    },
    {
      id: "js:2:aptos:474d:aptos-0x06a6-IN",
      hash: "0x06a6",
      type: "IN",
      value: BigNumber(2000000),
      fee: BigNumber(1200),
      blockHash: "0xbae2",
      blockHeight: 313836935,
      senders: ["0x4e5e"],
      recipients: ["0xa0d8"],
      accountId:
        "js:2:aptos:474d:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
      date: firstOperationDate,
      extra: {
        version: "2544815758",
      },
      transactionSequenceNumber: 31,
      hasFailed: false,
    },
  ] as Operation[];

  it("returns the correct information", async () => {
    const mockGetBalance = jest.fn().mockImplementation(() => BigNumber(1234567));
    mockedAptosAPI.mockImplementation(() => ({
      getBalance: mockGetBalance,
    }));

    const subAccount = await getSubAccountShape(currency, address, parentId, token, operations);

    expect(subAccount).toEqual({
      type: "TokenAccount",
      id: "js:2:aptos:474d:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
      parentId,
      token,
      balance: BigNumber(1234567),
      spendableBalance: BigNumber(1234567),
      creationDate: firstOperationDate,
      operations,
      operationsCount: operations.length,
      pendingOperations: [],
      balanceHistoryCache: emptyHistoryCache,
      swapHistory: [],
    });

    expect(mockedAptosAPI).toHaveBeenCalledTimes(1);
  });
});

describe("getSubAccounts", () => {
  beforeEach(() => {
    mockedAptosAPI = jest.mocked(AptosAPI);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const address = "0x4e5e65d5c7a3191e4310ecd210e8f0ff53823189123b47086d928bd574a573d1";
  const infos = {
    currency: {
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
    address,
    index: 1,
    derivationPath: "44'/637'/0'",
    derivationMode: "aptos",
  } as AccountShapeInfo<Account>;
  const accountId = "js:2:aptos:3282:aptos";
  const lastTokenOperations = [
    {
      id: "js:2:aptos:474d:aptos-0x2011-IN",
      hash: "0x2011",
      type: "IN",
      value: BigNumber(2000000),
      fee: BigNumber(1200),
      blockHash: "0xf29363a5a78d784c702a8ea352ac3e1461092cc2347b305adcace14aa7b15d60",
      blockHeight: 315151047,
      senders: ["0x4e5e"],
      recipients: ["0xa0d8"],
      accountId:
        "js:2:aptos:474d:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
      date: new Date(1000),
      extra: {
        version: "2553182323",
      },
      transactionSequenceNumber: 32,
      hasFailed: false,
    },
    {
      id: "js:2:aptos:474d:aptos-0x06a6-IN",
      hash: "0x06a6",
      type: "IN",
      value: BigNumber(2000000),
      fee: BigNumber(1200),
      blockHash: "0xbae2",
      blockHeight: 313836935,
      senders: ["0x4e5e"],
      recipients: ["0xa0d8"],
      accountId:
        "js:2:aptos:474d:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
      date: new Date(10),
      extra: {
        version: "2544815758",
      },
      transactionSequenceNumber: 31,
      hasFailed: false,
    },
  ] as Operation[];

  it("returns the correct information", async () => {
    const mockGetBalance = jest.fn().mockImplementation(() => BigNumber(1234567));
    mockedAptosAPI.mockImplementation(() => ({
      getBalance: mockGetBalance,
    }));

    mockedDecodeTokenAccountId.mockReturnValue({
      token: {
        type: "TokenCurrency",
        id: "aptos/coin/dstapt_0xd111::staked_coin::stakedaptos",
        contractAddress: "0xd111::staked_coin::StakedAptos",
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
      accountId: "js:2:aptos:6415:aptos",
    });

    const result = await getSubAccounts(infos, address, accountId, lastTokenOperations);

    expect(result).toEqual([
      {
        type: "TokenAccount",
        id: "js:2:aptos:3282:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
        parentId: "js:2:aptos:3282:aptos",
        token: {
          type: "TokenCurrency",
          id: "aptos/coin/dstapt_0xd111::staked_coin::stakedaptos",
          contractAddress: "0xd111::staked_coin::StakedAptos",
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
        balance: BigNumber(1234567),
        spendableBalance: BigNumber(1234567),
        creationDate: new Date(10),
        operations: [
          {
            accountId:
              "js:2:aptos:474d:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
            blockHash: "0xf29363a5a78d784c702a8ea352ac3e1461092cc2347b305adcace14aa7b15d60",
            blockHeight: 315151047,
            date: new Date(1000),
            extra: { version: "2553182323" },
            fee: BigNumber(1200),
            hasFailed: false,
            hash: "0x2011",
            id: "js:2:aptos:474d:aptos-0x2011-IN",
            recipients: ["0xa0d8"],
            senders: ["0x4e5e"],
            transactionSequenceNumber: 32,
            type: "IN",
            value: BigNumber(2000000),
          },
          {
            accountId:
              "js:2:aptos:474d:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
            blockHash: "0xbae2",
            blockHeight: 313836935,
            date: new Date(10),
            fee: BigNumber(1200),
            extra: { version: "2544815758" },
            hasFailed: false,
            hash: "0x06a6",
            id: "js:2:aptos:474d:aptos-0x06a6-IN",
            recipients: ["0xa0d8"],
            senders: ["0x4e5e"],
            transactionSequenceNumber: 31,
            type: "IN",
            value: BigNumber(2000000),
          },
        ],
        operationsCount: 2,
        pendingOperations: [],
        balanceHistoryCache: emptyHistoryCache,
        swapHistory: [],
      },
    ]);
  });
});
