import { AccountShapeInfo, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { Operation, SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import { decodeTokenAccountId } from "@ledgerhq/coin-framework/account";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { AptosAPI } from "../../api";
import {
  getAccountShape,
  mergeSubAccounts,
  getSubAccountShape,
  getSubAccounts,
  groupAllStakeOpsByValidator,
  generateStakes,
} from "../../bridge/synchronisation";
import BigNumber from "bignumber.js";
import { createFixtureAccount } from "../../bridge/bridge.fixture";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { txsToOps } from "../../bridge/logic";
import { AptosAccount } from "../../types";

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
    encodeAccountId: originalModule.encodeAccountId,
    decodeAccountId: originalModule.decodeAccountId,
    encodeTokenAccountId: originalModule.encodeTokenAccountId,
  };
});

const mockedDecodeTokenAccountId = jest.mocked(decodeTokenAccountId);

jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers");
jest.mock("invariant", () => jest.fn());

jest.mock("../../api");
let mockedAptosAPI: jest.Mocked<any>;

jest.mock("../../bridge/logic");

describe("getAccountShape", () => {
  beforeEach(() => {
    mockedAptosAPI = jest.mocked(AptosAPI);
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

    jest.mocked(mergeOps).mockReturnValue([]);
    jest.mocked(txsToOps).mockReturnValue([[], [], [], []]);

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
      } as unknown as AccountShapeInfo<AptosAccount>,
      {} as SyncConfig,
    );

    expect(account.xpub).toEqual("address");
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

    jest.mocked(mergeOps).mockReturnValue([]);
    jest.mocked(txsToOps).mockReturnValue([[], [], [], []]);

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
      } as unknown as AccountShapeInfo<AptosAccount>,
      {} as SyncConfig,
    );

    expect(account.xpub).toEqual("1");
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

    jest.mocked(mergeOps).mockReturnValue([]);
    jest.mocked(txsToOps).mockReturnValue([[], [], [], []]);

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
      } as unknown as AccountShapeInfo<AptosAccount>,
      {} as SyncConfig,
    );

    expect(account.xpub).toEqual("");
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

    jest.mocked(mergeOps).mockReturnValue([]);
    jest.mocked(txsToOps).mockReturnValue([[], [], [], []]);

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
      } as unknown as AccountShapeInfo<AptosAccount>,
      {} as SyncConfig,
    );

    expect(account.xpub).toEqual("1");
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

    jest.mocked(mergeOps).mockReturnValue([]);
    jest.mocked(txsToOps).mockReturnValue([[], [], [], []]);

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
      } as unknown as AccountShapeInfo<AptosAccount>,
      {} as SyncConfig,
    );

    expect(account.xpub).toEqual("1");
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

    jest.mocked(mergeOps).mockReturnValue([]);
    jest.mocked(txsToOps).mockReturnValue([[], [], [], []]);

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
        rest: { publicKey: "restPublicKey" },
      } as unknown as AccountShapeInfo<AptosAccount>,
      {} as SyncConfig,
    );

    expect(account.xpub).toEqual("restPublicKey");
    expect(mockedAptosAPI).toHaveBeenCalledTimes(1);
    expect(mockGetAccountSpy).toHaveBeenCalledWith("address");
  });

  it("should merge new delegated and undelegated stakes without duplication", async () => {
    const mockGetAccountInfo = jest.fn().mockResolvedValue({
      balance: BigInt(0),
      transactions: [],
      blockHeight: 0,
    });

    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
    }));

    const existingStakes = [
      {
        stakeAccAddr: "0xpool1",
        hasStakeAuth: true,
        hasWithdrawAuth: true,
        delegation: {
          stake: 1000000,
          voteAccAddr: "0xpool1",
        },
        stakeAccBalance: 1000000,
        withdrawable: 0,
        activation: {
          state: "active",
          active: 1000000,
          inactive: 0,
        },
      },
    ];

    // Directly initializing operations in the arrays
    const stakingOperations = [
      {
        id: "op1",
        accountId: "acc1",
        fee: new BigNumber(0),
        value: new BigNumber(1000000),
        type: "DELEGATE",
        senders: ["0xuser"],
        recipients: ["0xpool1"],
        hasFailed: false,
        blockHeight: 1000,
        date: new Date(),
        extra: {},
      },
    ] as Operation[];

    const withdrawOperations = [
      {
        id: "op2",
        accountId: "acc1",
        fee: new BigNumber(0),
        value: new BigNumber(200000),
        type: "UNDELEGATE",
        senders: ["0xuser"],
        recipients: ["0xpool1"],
        hasFailed: false,
        blockHeight: 1001,
        date: new Date(),
        extra: {},
      },
    ] as Operation[];

    jest.mocked(mergeOps).mockReturnValue([]);
    jest.mocked(txsToOps).mockReturnValue([[], [], stakingOperations, withdrawOperations]);

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
          aptosResources: {
            stakes: existingStakes,
          },
        },
      } as unknown as AccountShapeInfo<AptosAccount>,
      {} as SyncConfig,
    );

    expect(account.aptosResources?.stakes).toHaveLength(1);
    expect(account.aptosResources?.stakes[0].stakeAccAddr).toBe("0xpool1");
    expect(account.aptosResources?.stakes[0].withdrawable).toBe(200000);
    expect(account.aptosResources?.stakes[0].delegation?.stake).toBe(1000000);
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

describe("groupAllStakeOpsByValidator", () => {
  const baseOperation = {
    accountId: "js:2:aptos:1234:aptos",
    fee: new BigNumber(100),
    blockHeight: 123456,
    senders: ["0xsender"],
    recipients: ["0xvalidator"],
    hash: "0xtxhash",
    hasFailed: false,
    date: new Date(),
    extra: {},
    transactionSequenceNumber: 1,
    blockHash: "0xblock",
  };

  it("should return an empty object when no operations provided", () => {
    const result = groupAllStakeOpsByValidator([], []);
    expect(result).toEqual({});
  });

  it("should group only DELEGATE operation", () => {
    const delegateOp: Operation = {
      ...baseOperation,
      type: "DELEGATE",
      value: new BigNumber(1000),
      id: "delegate-op",
    };

    const result = groupAllStakeOpsByValidator([delegateOp], []);
    expect(Object.keys(result)).toHaveLength(1);
    expect(result["0xvalidator"]).toEqual([delegateOp]);
  });

  it("should group only UNDELEGATE operation", () => {
    const undelegateOp: Operation = {
      ...baseOperation,
      type: "UNDELEGATE",
      value: new BigNumber(500),
      id: "undelegate-op",
    };

    const result = groupAllStakeOpsByValidator([], [undelegateOp]);
    expect(Object.keys(result)).toHaveLength(1);
    expect(result["0xvalidator"]).toEqual([undelegateOp]);
  });

  it("should group both DELEGATE and UNDELEGATE operations by validator", () => {
    const delegateOp: Operation = {
      ...baseOperation,
      type: "DELEGATE",
      value: new BigNumber(1000),
      id: "delegate-op",
    };

    const undelegateOp: Operation = {
      ...baseOperation,
      type: "UNDELEGATE",
      value: new BigNumber(500),
      id: "undelegate-op",
    };

    const result = groupAllStakeOpsByValidator([delegateOp], [undelegateOp]);
    expect(Object.keys(result)).toHaveLength(1);
    expect(result["0xvalidator"]).toEqual([delegateOp, undelegateOp]);
  });
});

describe("generateStakes", () => {
  const poolAddress = "0xpool123";

  it("should return empty delegation if no operations", () => {
    const stakes = generateStakes({});
    expect(stakes).toEqual([]);
  });

  it("should generate a stake with only delegated amount", () => {
    const ops: Operation[] = [
      {
        id: "1",
        hash: "0x1",
        type: "DELEGATE",
        value: BigNumber(1000000),
        fee: BigNumber(0),
        blockHash: "",
        blockHeight: 0,
        senders: ["0x1"],
        recipients: [poolAddress],
        accountId: "acc1",
        date: new Date(),
        extra: {},
        transactionSequenceNumber: 0,
        hasFailed: false,
      },
    ];

    const stakes = generateStakes({ [poolAddress]: ops });
    expect(stakes).toMatchObject([
      {
        stakeAccAddr: poolAddress,
        delegation: {
          stake: 1000000,
          voteAccAddr: poolAddress,
        },
        withdrawable: 0,
        activation: {
          state: "active",
          active: 1000000,
          inactive: 0,
        },
      },
    ]);
  });

  it("should generate a stake with only withdrawable amount", () => {
    const ops: Operation[] = [
      {
        id: "2",
        hash: "0x2",
        type: "UNDELEGATE",
        value: BigNumber(500000),
        fee: BigNumber(0),
        blockHash: "",
        blockHeight: 0,
        senders: ["0x1"],
        recipients: [poolAddress],
        accountId: "acc2",
        date: new Date(),
        extra: {},
        transactionSequenceNumber: 1,
        hasFailed: false,
      },
    ];

    const stakes = generateStakes({ [poolAddress]: ops });
    expect(stakes).toMatchObject([
      {
        stakeAccAddr: poolAddress,
        delegation: undefined,
        withdrawable: 500000,
        activation: {
          state: "inactive",
          active: 0,
          inactive: 500000,
        },
      },
    ]);
  });

  it("should generate a stake with both delegated and withdrawable", () => {
    const ops: Operation[] = [
      {
        id: "1",
        hash: "0x1",
        type: "DELEGATE",
        value: BigNumber(1000000),
        fee: BigNumber(0),
        blockHash: "",
        blockHeight: 0,
        senders: ["0x1"],
        recipients: [poolAddress],
        accountId: "acc1",
        date: new Date(),
        extra: {},
        transactionSequenceNumber: 0,
        hasFailed: false,
      },
      {
        id: "2",
        hash: "0x2",
        type: "UNDELEGATE",
        value: BigNumber(300000),
        fee: BigNumber(0),
        blockHash: "",
        blockHeight: 0,
        senders: ["0x1"],
        recipients: [poolAddress],
        accountId: "acc2",
        date: new Date(),
        extra: {},
        transactionSequenceNumber: 1,
        hasFailed: false,
      },
    ];

    const stakes = generateStakes({ [poolAddress]: ops });
    expect(stakes).toMatchObject([
      {
        stakeAccAddr: poolAddress,
        delegation: {
          stake: 1000000,
          voteAccAddr: poolAddress,
        },
        withdrawable: 300000,
        activation: {
          state: "deactivating",
          active: 1000000,
          inactive: 300000,
        },
      },
    ]);
  });
});
