import { decodeTokenAccountId } from "@ledgerhq/coin-framework/account";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { AccountShapeInfo, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation, SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { createFixtureAccount } from "../../bridge/bridge.fixture";
import { txsToOps } from "../../bridge/logic";
import {
  getAccountShape,
  mergeSubAccounts,
  getSubAccountShape,
  getSubAccounts,
} from "../../bridge/synchronisation";
import { AptosAPI } from "../../network";
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

jest.mock("../../network");
let mockedAptosAPI: jest.Mocked<any>;

jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers");
jest.mock("invariant", () => jest.fn());

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
      balance: BigNumber(0),
      transactions: [],
      blockHeight: 0,
    }));
    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
    }));
    const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

    jest.mocked(mergeOps).mockReturnValue([]);
    jest.mocked(txsToOps).mockResolvedValue([[], [], []]);

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
          balance: BigNumber(10),
          spendableBalance: BigNumber(10),
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
      balance: BigNumber(0),
      transactions: [],
      blockHeight: 0,
    }));
    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
    }));
    const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

    jest.mocked(mergeOps).mockReturnValue([]);
    jest.mocked(txsToOps).mockResolvedValue([[], [], []]);

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
          balance: BigNumber(10),
          spendableBalance: BigNumber(10),
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
      balance: BigNumber(0),
      transactions: [],
      blockHeight: 0,
    }));
    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
    }));
    const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

    jest.mocked(mergeOps).mockReturnValue([]);
    jest.mocked(txsToOps).mockResolvedValue([[], [], []]);

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
      balance: BigNumber(0),
      transactions: [],
      blockHeight: 0,
    }));
    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
    }));
    const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

    jest.mocked(mergeOps).mockReturnValue([]);
    jest.mocked(txsToOps).mockResolvedValue([[], [], []]);

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
          balance: BigNumber(10),
          spendableBalance: BigNumber(10),
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
      balance: BigNumber(0),
      transactions: [],
      blockHeight: 0,
    }));
    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
    }));
    const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

    jest.mocked(mergeOps).mockReturnValue([]);
    jest.mocked(txsToOps).mockResolvedValue([[], [], []]);

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
          balance: BigNumber(10),
          spendableBalance: BigNumber(10),
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
      balance: BigNumber(0),
      transactions: [],
      blockHeight: 0,
    }));
    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
    }));
    const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

    jest.mocked(mergeOps).mockReturnValue([]);
    jest.mocked(txsToOps).mockResolvedValue([[], [], []]);

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
          balance: BigNumber(10),
          spendableBalance: BigNumber(10),
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

  it("initialAccount with operations with subOperations", async () => {
    const mockGetAccountInfo = jest.fn().mockImplementation(async () => ({
      balance: BigNumber(68254118),
      transactions: [
        {
          version: "2532591427",
          hash: "0x3f35",
          state_change_hash: "0xb480",
          event_root_hash: "0x3fa1",
          state_checkpoint_hash: null,
          gas_used: "12",
          success: true,
          vm_status: "Executed successfully",
          accumulator_root_hash: "0x319f",
          changes: [
            {
              address: "0x4e5e",
              state_key_hash: "0x3c0c",
              data: {
                type: "0x1::coin::CoinStore<0xd111::staked_coin::StakedAptos>",
                data: {
                  coin: {
                    value: "4000000",
                  },
                  deposit_events: {
                    counter: "9",
                    guid: {
                      id: {
                        addr: "0x4e5e",
                        creation_num: "4",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "6",
                    guid: {
                      id: {
                        addr: "0x4e5e",
                        creation_num: "5",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d8",
              state_key_hash: "0x1709",
              data: {
                type: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
                data: {
                  coin: {
                    value: "68254118",
                  },
                  deposit_events: {
                    counter: "46",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "2",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "89",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "3",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d8",
              state_key_hash: "0x5520",
              data: {
                type: "0x1::coin::CoinStore<0xd111::staked_coin::StakedAptos>",
                data: {
                  coin: {
                    value: "1000000",
                  },
                  deposit_events: {
                    counter: "7",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "10",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "13",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "11",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d8",
              state_key_hash: "0x6f1e",
              data: {
                type: "0x1::account::Account",
                data: {
                  authentication_key: "0xa0d8",
                  coin_register_events: {
                    counter: "5",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "0",
                      },
                    },
                  },
                  guid_creation_num: "12",
                  key_rotation_events: {
                    counter: "0",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "1",
                      },
                    },
                  },
                  rotation_capability_offer: {
                    for: {
                      vec: [],
                    },
                  },
                  sequence_number: "122",
                  signer_capability_offer: {
                    for: {
                      vec: [],
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              state_key_hash: "0x6e4b",
              handle: "0x1b85",
              key: "0x0619",
              value: "0x1ddaf8da3b1497010000000000000000",
              data: null,
              type: "write_table_item",
            },
          ],
          sender: "0xa0d8",
          sequence_number: "121",
          max_gas_amount: "12",
          gas_unit_price: "100",
          expiration_timestamp_secs: "1743177404",
          payload: {
            function: "0x1::aptos_account::transfer_coins",
            type_arguments: ["0xd111::staked_coin::StakedAptos"],
            arguments: ["0x4e5e", "1500000"],
            type: "entry_function_payload",
          },
          signature: {
            public_key: "0x474d",
            signature: "0x0ad8",
            type: "ed25519_signature",
          },
          events: [
            {
              guid: {
                creation_number: "11",
                account_address: "0xa0d8",
              },
              sequence_number: "12",
              type: "0x1::coin::WithdrawEvent",
              data: {
                amount: "1500000",
              },
            },
            {
              guid: {
                creation_number: "4",
                account_address: "0x4e5e",
              },
              sequence_number: "8",
              type: "0x1::coin::DepositEvent",
              data: {
                amount: "1500000",
              },
            },
            {
              guid: {
                creation_number: "0",
                account_address: "0x0",
              },
              sequence_number: "0",
              type: "0x1::transaction_fee::FeeStatement",
              data: {
                execution_gas_units: "6",
                io_gas_units: "6",
                storage_fee_octas: "0",
                storage_fee_refund_octas: "0",
                total_charge_gas_units: "12",
              },
            },
          ],
          timestamp: "1743177360481259",
          type: "user_transaction",
          block: {
            height: 311948147,
            hash: "0x6d02",
          },
        },
        {
          version: "2532549325",
          hash: "0x9a6b",
          state_change_hash: "0xa424",
          event_root_hash: "0x0321",
          state_checkpoint_hash: null,
          gas_used: "12",
          success: true,
          vm_status: "Executed successfully",
          accumulator_root_hash: "0xede9",
          changes: [
            {
              address: "0x4e5e",
              state_key_hash: "0x3c0c",
              data: {
                type: "0x1::coin::CoinStore<0xd111::staked_coin::StakedAptos>",
                data: {
                  coin: {
                    value: "2500000",
                  },
                  deposit_events: {
                    counter: "8",
                    guid: {
                      id: {
                        addr: "0x4e5e",
                        creation_num: "4",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "6",
                    guid: {
                      id: {
                        addr: "0x4e5e",
                        creation_num: "5",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d8",
              state_key_hash: "0x1709",
              data: {
                type: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
                data: {
                  coin: {
                    value: "68255318",
                  },
                  deposit_events: {
                    counter: "46",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "2",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "89",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "3",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d8",
              state_key_hash: "0x5520",
              data: {
                type: "0x1::coin::CoinStore<0xd111::staked_coin::StakedAptos>",
                data: {
                  coin: {
                    value: "2500000",
                  },
                  deposit_events: {
                    counter: "7",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "10",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "12",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "11",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d8",
              state_key_hash: "0x6f1e",
              data: {
                type: "0x1::account::Account",
                data: {
                  authentication_key: "0xa0d8",
                  coin_register_events: {
                    counter: "5",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "0",
                      },
                    },
                  },
                  guid_creation_num: "12",
                  key_rotation_events: {
                    counter: "0",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "1",
                      },
                    },
                  },
                  rotation_capability_offer: {
                    for: {
                      vec: [],
                    },
                  },
                  sequence_number: "121",
                  signer_capability_offer: {
                    for: {
                      vec: [],
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              state_key_hash: "0x6e4b",
              handle: "0x1b85",
              key: "0x0619",
              value: "0xe86e0039581497010000000000000000",
              data: null,
              type: "write_table_item",
            },
          ],
          sender: "0xa0d8",
          sequence_number: "120",
          max_gas_amount: "12",
          gas_unit_price: "100",
          expiration_timestamp_secs: "1743176706",
          payload: {
            function: "0x1::aptos_account::transfer_coins",
            type_arguments: ["0xd111::staked_coin::StakedAptos"],
            arguments: ["0x4e5e", "2500000"],
            type: "entry_function_payload",
          },
          signature: {
            public_key: "0x474d",
            signature: "0xb70e",
            type: "ed25519_signature",
          },
          events: [
            {
              guid: {
                creation_number: "11",
                account_address: "0xa0d8",
              },
              sequence_number: "11",
              type: "0x1::coin::WithdrawEvent",
              data: {
                amount: "2500000",
              },
            },
            {
              guid: {
                creation_number: "4",
                account_address: "0x4e5e",
              },
              sequence_number: "7",
              type: "0x1::coin::DepositEvent",
              data: {
                amount: "2500000",
              },
            },
            {
              guid: {
                creation_number: "0",
                account_address: "0x0",
              },
              sequence_number: "0",
              type: "0x1::transaction_fee::FeeStatement",
              data: {
                execution_gas_units: "6",
                io_gas_units: "6",
                storage_fee_octas: "0",
                storage_fee_refund_octas: "0",
                total_charge_gas_units: "12",
              },
            },
          ],
          timestamp: "1743176594693251",
          type: "user_transaction",
          block: {
            height: 311942427,
            hash: "0x8655",
          },
        },
      ],
      blockHeight: 316278241,
    }));

    const TOKEN_CONTRACT_ADDRESS = "0xd111::staked_coin::StakedAptos";

    const mockGetBalances = jest
      .fn()
      .mockResolvedValue([{ contractAddress: TOKEN_CONTRACT_ADDRESS, amount: BigNumber(1234567) }]);

    mockedAptosAPI.mockImplementation(() => ({
      getBalances: mockGetBalances,
      getAccountInfo: mockGetAccountInfo,
    }));

    const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

    mockedDecodeTokenAccountId.mockResolvedValue({
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

    const operations = [
      {
        id: "js:2:aptos:474d:aptos-0x3f35-OUT",
        hash: "0x3f35",
        type: "FEES",
        value: BigNumber(1200),
        fee: BigNumber(1200),
        blockHash: "0x6d02",
        blockHeight: 311948147,
        senders: ["0xa0d8"],
        recipients: ["0x4e5e"],
        accountId: "js:2:aptos:474d:aptos",
        date: new Date("2025-03-28T15:56:00.481Z"),
        extra: {
          version: "2532591427",
        },
        transactionSequenceNumber: new BigNumber(121),
        hasFailed: false,
      },
      {
        id: "js:2:aptos:474d:aptos-0x9a6b-OUT",
        hash: "0x9a6b",
        type: "FEES",
        value: BigNumber(1200),
        fee: BigNumber(1200),
        blockHash: "0x8655",
        blockHeight: 311942427,
        senders: ["0xa0d8"],
        recipients: ["0x4e5e"],
        accountId: "js:2:aptos:474d:aptos",
        date: new Date("2025-03-28T15:43:14.693Z"),
        extra: {
          version: "2532549325",
        },
        transactionSequenceNumber: new BigNumber(120),
        hasFailed: false,
      },
    ] as Operation[];

    const tokenOperations = [
      {
        id: "js:2:aptos:474d:aptos-0x3f35-OUT",
        hash: "0x3f35",
        type: "OUT",
        value: BigNumber(1500000),
        fee: BigNumber(1200),
        blockHash: "0x6d02",
        blockHeight: 311948147,
        senders: ["0xa0d8"],
        recipients: ["0x4e5e"],
        accountId:
          "js:2:aptos:474d:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
        date: new Date("2025-03-28T15:56:00.481Z"),
        extra: {
          version: "2532591427",
        },
        transactionSequenceNumber: new BigNumber(121),
        hasFailed: false,
      },
      {
        id: "js:2:aptos:474d:aptos-0x9a6b-OUT",
        hash: "0x9a6b",
        type: "OUT",
        value: BigNumber(2500000),
        fee: BigNumber(1200),
        blockHash: "0x8655",
        blockHeight: 311942427,
        senders: ["0xa0d8"],
        recipients: ["0x4e5e"],
        accountId:
          "js:2:aptos:474d:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
        date: new Date("2025-03-28T15:43:14.693Z"),
        extra: {
          version: "2532549325",
        },
        transactionSequenceNumber: new BigNumber(120),
        hasFailed: false,
      },
    ] as Operation[];

    const stakingOperations = [] as Operation[];

    jest.mocked(mergeOps).mockReturnValue(operations);
    jest.mocked(txsToOps).mockResolvedValue([operations, tokenOperations, stakingOperations]);

    const info = {
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
      },
      index: 0,
      address: "0xa0d8",
      derivationPath: "44'/637'/0'",
      derivationMode: "aptos",
      initialAccount: {
        type: "Account",
        id: "js:2:aptos:474d:aptos",
        used: true,
        seedIdentifier: "3086",
        derivationMode: "aptos",
        index: 0,
        freshAddress: "0xa0d8",
        freshAddressPath: "44'/637'/0'/0'/0'",
        blockHeight: 316272224,
        creationDate: "2025-01-16T14:17:41.076Z",
        balance: BigNumber(68254118),
        spendableBalance: BigNumber(68254118),
        operations: [],
        operationsCount: 0,
        pendingOperations: [],
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
        },
        lastSyncDate: new Date(),
        swapHistory: [],
        balanceHistoryCache: emptyHistoryCache,
        xpub: "474d",
        subAccounts: [
          {
            type: "TokenAccount",
            id: "js:2:aptos:474d:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
            parentId: "js:2:aptos:474d:aptos",
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
            balance: BigNumber(5000000),
            spendableBalance: BigNumber(5000000),
            creationDate: "2025-03-11T09:33:46.840Z",
            operations: [],
            operationsCount: 0,
            pendingOperations: [],
            swapHistory: [],
            balanceHistoryCache: emptyHistoryCache,
          },
        ],
      },
    } as unknown as AccountShapeInfo<AptosAccount>;

    const result = await getAccountShape(info, {} as SyncConfig);

    expect(result.operations).toHaveLength(2);
    expect(result.operations?.at(0)?.subOperations).toHaveLength(2);
    expect(result.operations?.at(1)?.subOperations).toHaveLength(2);
    expect(result.subAccounts).toHaveLength(1);
    expect(mockedAptosAPI).toHaveBeenCalledTimes(2);
    expect(mockGetAccountSpy).toHaveBeenCalledWith("0xa0d8");
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
      transactionSequenceNumber: new BigNumber(32),
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
      transactionSequenceNumber: new BigNumber(31),
      hasFailed: false,
    },
  ] as Operation[];

  it("returns the correct information", async () => {
    const TOKEN_CONTRACT_ADDRESS = "0xd111::staked_coin::StakedAptos";

    const mockGetBalances = jest
      .fn()
      .mockResolvedValue([{ contractAddress: TOKEN_CONTRACT_ADDRESS, amount: BigNumber(1234567) }]);

    mockedAptosAPI.mockImplementation(() => ({
      getBalances: mockGetBalances,
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

  const address = "0x4e5e";
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
  } as AccountShapeInfo<AptosAccount>;
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
      transactionSequenceNumber: new BigNumber(32),
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
      transactionSequenceNumber: new BigNumber(31),
      hasFailed: false,
    },
  ] as Operation[];

  it("returns the correct information", async () => {
    const TOKEN_CONTRACT_ADDRESS = "0xd111::staked_coin::StakedAptos";

    const mockGetBalances = jest
      .fn()
      .mockResolvedValue([{ contractAddress: TOKEN_CONTRACT_ADDRESS, amount: BigNumber(1234567) }]);

    mockedAptosAPI.mockImplementation(() => ({
      getBalances: mockGetBalances,
    }));

    mockedDecodeTokenAccountId.mockResolvedValue({
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
            transactionSequenceNumber: new BigNumber(32),
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
            transactionSequenceNumber: new BigNumber(31),
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

describe("getStake", () => {
  beforeEach(() => {
    mockedAptosAPI = jest.mocked(AptosAPI);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("When AptosResource has StakingPositions should validate", async () => {
    const mockDelegatorBalance = [1000000, 500000, 200000];

    const validatorAddress = "0xvalidator1";
    const stakingOperations = [
      {
        id: "js:2:aptos:474d:aptos-0x3f35-OUT",
        hash: "0x3f35",
        type: "STAKE",
        value: BigNumber(1200),
        fee: BigNumber(1200),
        blockHash: "0x6d02",
        blockHeight: 311948147,
        senders: ["0xa0d8"],
        recipients: [validatorAddress],
        accountId: "js:2:aptos:474d:aptos",
        date: new Date("2025-03-28T15:56:00.481Z"),
        extra: {
          version: "2532591427",
        },
        transactionSequenceNumber: new BigNumber(121),
        hasFailed: false,
      },
    ] as Operation[];

    const mockGetAccountInfo = jest.fn().mockImplementation(async () => ({
      balance: BigNumber(68254118),
      transactions: [
        {
          version: "2532591427",
          hash: "0x3f35",
          state_change_hash: "0xb480",
          event_root_hash: "0x3fa1",
          state_checkpoint_hash: null,
          gas_used: "12",
          success: true,
          vm_status: "Executed successfully",
          accumulator_root_hash: "0x319f",
          changes: [
            {
              address: "0x4e5e",
              state_key_hash: "0x3c0c",
              data: {
                type: "0x1::coin::CoinStore<0xd111::staked_coin::StakedAptos>",
                data: {
                  coin: {
                    value: "4000000",
                  },
                  deposit_events: {
                    counter: "9",
                    guid: {
                      id: {
                        addr: "0x4e5e",
                        creation_num: "4",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "6",
                    guid: {
                      id: {
                        addr: "0x4e5e",
                        creation_num: "5",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d8",
              state_key_hash: "0x1709",
              data: {
                type: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
                data: {
                  coin: {
                    value: "68254118",
                  },
                  deposit_events: {
                    counter: "46",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "2",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "89",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "3",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d8",
              state_key_hash: "0x5520",
              data: {
                type: "0x1::coin::CoinStore<0xd111::staked_coin::StakedAptos>",
                data: {
                  coin: {
                    value: "1000000",
                  },
                  deposit_events: {
                    counter: "7",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "10",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "13",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "11",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d8",
              state_key_hash: "0x6f1e",
              data: {
                type: "0x1::account::Account",
                data: {
                  authentication_key: "0xa0d8",
                  coin_register_events: {
                    counter: "5",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "0",
                      },
                    },
                  },
                  guid_creation_num: "12",
                  key_rotation_events: {
                    counter: "0",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "1",
                      },
                    },
                  },
                  rotation_capability_offer: {
                    for: {
                      vec: [],
                    },
                  },
                  sequence_number: "122",
                  signer_capability_offer: {
                    for: {
                      vec: [],
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              state_key_hash: "0x6e4b",
              handle: "0x1b85",
              key: "0x0619",
              value: "0x1ddaf8da3b1497010000000000000000",
              data: null,
              type: "write_table_item",
            },
          ],
          sender: "0xa0d8",
          sequence_number: "121",
          max_gas_amount: "12",
          gas_unit_price: "100",
          expiration_timestamp_secs: "1743177404",
          payload: {
            function: "0x1::aptos_account::transfer_coins",
            type_arguments: ["0xd111::staked_coin::StakedAptos"],
            arguments: ["0x4e5e", "1500000"],
            type: "entry_function_payload",
          },
          signature: {
            public_key: "0x474d",
            signature: "0x0ad8",
            type: "ed25519_signature",
          },
          events: [
            {
              guid: {
                creation_number: "11",
                account_address: "0xa0d8",
              },
              sequence_number: "12",
              type: "0x1::coin::WithdrawEvent",
              data: {
                amount: "1500000",
              },
            },
            {
              guid: {
                creation_number: "4",
                account_address: "0x4e5e",
              },
              sequence_number: "8",
              type: "0x1::coin::DepositEvent",
              data: {
                amount: "1500000",
              },
            },
            {
              guid: {
                creation_number: "0",
                account_address: "0x0",
              },
              sequence_number: "0",
              type: "0x1::transaction_fee::FeeStatement",
              data: {
                execution_gas_units: "6",
                io_gas_units: "6",
                storage_fee_octas: "0",
                storage_fee_refund_octas: "0",
                total_charge_gas_units: "12",
              },
            },
          ],
          timestamp: "1743177360481259",
          type: "user_transaction",
          block: {
            height: 311948147,
            hash: "0x6d02",
          },
        },
        {
          version: "2532549325",
          hash: "0x9a6b",
          state_change_hash: "0xa424",
          event_root_hash: "0x0321",
          state_checkpoint_hash: null,
          gas_used: "12",
          success: true,
          vm_status: "Executed successfully",
          accumulator_root_hash: "0xede9",
          changes: [
            {
              address: "0x4e5e",
              state_key_hash: "0x3c0c",
              data: {
                type: "0x1::coin::CoinStore<0xd111::staked_coin::StakedAptos>",
                data: {
                  coin: {
                    value: "2500000",
                  },
                  deposit_events: {
                    counter: "8",
                    guid: {
                      id: {
                        addr: "0x4e5e",
                        creation_num: "4",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "6",
                    guid: {
                      id: {
                        addr: "0x4e5e",
                        creation_num: "5",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d8",
              state_key_hash: "0x1709",
              data: {
                type: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
                data: {
                  coin: {
                    value: "68255318",
                  },
                  deposit_events: {
                    counter: "46",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "2",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "89",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "3",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d8",
              state_key_hash: "0x5520",
              data: {
                type: "0x1::coin::CoinStore<0xd111::staked_coin::StakedAptos>",
                data: {
                  coin: {
                    value: "2500000",
                  },
                  deposit_events: {
                    counter: "7",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "10",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "12",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "11",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d8",
              state_key_hash: "0x6f1e",
              data: {
                type: "0x1::account::Account",
                data: {
                  authentication_key: "0xa0d8",
                  coin_register_events: {
                    counter: "5",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "0",
                      },
                    },
                  },
                  guid_creation_num: "12",
                  key_rotation_events: {
                    counter: "0",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "1",
                      },
                    },
                  },
                  rotation_capability_offer: {
                    for: {
                      vec: [],
                    },
                  },
                  sequence_number: "121",
                  signer_capability_offer: {
                    for: {
                      vec: [],
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              state_key_hash: "0x6e4b",
              handle: "0x1b85",
              key: "0x0619",
              value: "0xe86e0039581497010000000000000000",
              data: null,
              type: "write_table_item",
            },
          ],
          sender: "0xa0d8",
          sequence_number: "120",
          max_gas_amount: "12",
          gas_unit_price: "100",
          expiration_timestamp_secs: "1743176706",
          payload: {
            function: "0x1::aptos_account::transfer_coins",
            type_arguments: ["0xd111::staked_coin::StakedAptos"],
            arguments: ["0x4e5e", "2500000"],
            type: "entry_function_payload",
          },
          signature: {
            public_key: "0x474d",
            signature: "0xb70e",
            type: "ed25519_signature",
          },
          events: [
            {
              guid: {
                creation_number: "11",
                account_address: "0xa0d8",
              },
              sequence_number: "11",
              type: "0x1::coin::WithdrawEvent",
              data: {
                amount: "2500000",
              },
            },
            {
              guid: {
                creation_number: "4",
                account_address: "0x4e5e",
              },
              sequence_number: "7",
              type: "0x1::coin::DepositEvent",
              data: {
                amount: "2500000",
              },
            },
            {
              guid: {
                creation_number: "0",
                account_address: "0x0",
              },
              sequence_number: "0",
              type: "0x1::transaction_fee::FeeStatement",
              data: {
                execution_gas_units: "6",
                io_gas_units: "6",
                storage_fee_octas: "0",
                storage_fee_refund_octas: "0",
                total_charge_gas_units: "12",
              },
            },
          ],
          timestamp: "1743176594693251",
          type: "user_transaction",
          block: {
            height: 311942427,
            hash: "0x8655",
          },
        },
      ],
      blockHeight: 316278241,
    }));

    const mockGetBalance = jest.fn().mockImplementation(() => BigNumber(5000000));

    mockedDecodeTokenAccountId.mockResolvedValue({
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

    const operations = [
      {
        id: "js:2:aptos:474d:aptos-0x3f35-OUT",
        hash: "0x3f35",
        type: "FEES",
        value: BigNumber(1200),
        fee: BigNumber(1200),
        blockHash: "0x6d02",
        blockHeight: 311948147,
        senders: ["0xa0d8"],
        recipients: ["0x4e5e"],
        accountId: "js:2:aptos:474d:aptos",
        date: new Date("2025-03-28T15:56:00.481Z"),
        extra: {
          version: "2532591427",
        },
        transactionSequenceNumber: new BigNumber(121),
        hasFailed: false,
      },
      {
        id: "js:2:aptos:474d:aptos-0x9a6b-OUT",
        hash: "0x9a6b",
        type: "FEES",
        value: BigNumber(1200),
        fee: BigNumber(1200),
        blockHash: "0x8655",
        blockHeight: 311942427,
        senders: ["0xa0d8"],
        recipients: ["0x4e5e"],
        accountId: "js:2:aptos:474d:aptos",
        date: new Date("2025-03-28T15:43:14.693Z"),
        extra: {
          version: "2532549325",
        },
        transactionSequenceNumber: new BigNumber(120),
        hasFailed: false,
      },
    ] as Operation[];

    const tokenOperations = [
      {
        id: "js:2:aptos:474d:aptos-0x3f35-OUT",
        hash: "0x3f35",
        type: "OUT",
        value: BigNumber(1500000),
        fee: BigNumber(1200),
        blockHash: "0x6d02",
        blockHeight: 311948147,
        senders: ["0xa0d8"],
        recipients: ["0x4e5e"],
        accountId:
          "js:2:aptos:474d:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
        date: new Date("2025-03-28T15:56:00.481Z"),
        extra: {
          version: "2532591427",
        },
        transactionSequenceNumber: new BigNumber(121),
        hasFailed: false,
      },
      {
        id: "js:2:aptos:474d:aptos-0x9a6b-OUT",
        hash: "0x9a6b",
        type: "OUT",
        value: BigNumber(2500000),
        fee: BigNumber(1200),
        blockHash: "0x8655",
        blockHeight: 311942427,
        senders: ["0xa0d8"],
        recipients: ["0x4e5e"],
        accountId:
          "js:2:aptos:474d:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
        date: new Date("2025-03-28T15:43:14.693Z"),
        extra: {
          version: "2532549325",
        },
        transactionSequenceNumber: new BigNumber(120),
        hasFailed: false,
      },
    ] as Operation[];

    const mockedGetDelegatorBalanceInPool = jest.fn().mockResolvedValue([
      BigNumber(mockDelegatorBalance[0]), // active
      BigNumber(mockDelegatorBalance[1]), // inactive
      BigNumber(mockDelegatorBalance[2]), // pending_inactive
    ]);

    mockedAptosAPI.mockImplementation(() => ({
      getAccountInfo: mockGetAccountInfo,
      getDelegatorBalanceInPool: mockedGetDelegatorBalanceInPool,
      getBalances: mockGetBalance,
    }));

    jest.mocked(mergeOps).mockReturnValue(operations);
    jest.mocked(txsToOps).mockResolvedValue([operations, tokenOperations, stakingOperations]);

    const info = {
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
      },
      index: 0,
      address: "0xa0d8",
      derivationPath: "44'/637'/0'",
      derivationMode: "aptos",
      initialAccount: {
        type: "Account",
        id: "js:2:aptos:474d:aptos",
        used: true,
        seedIdentifier: "3086",
        derivationMode: "aptos",
        index: 0,
        freshAddress: "0xa0d8",
        freshAddressPath: "44'/637'/0'/0'/0'",
        blockHeight: 316272224,
        creationDate: "2025-01-16T14:17:41.076Z",
        balance: BigNumber(68254118),
        spendableBalance: BigNumber(68254118),
        operations: [],
        operationsCount: 0,
        pendingOperations: [],
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
        },
        lastSyncDate: new Date(),
        swapHistory: [],
        balanceHistoryCache: emptyHistoryCache,
        xpub: "474d",
        subAccounts: [
          {
            type: "TokenAccount",
            id: "js:2:aptos:474d:aptos+aptos%2Fcoin%2Fdstapt~!underscore!~0xd111%3A%3Astaked~!underscore!~coin%3A%3Astakedaptos",
            parentId: "js:2:aptos:474d:aptos",
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
            balance: BigNumber(5000000),
            spendableBalance: BigNumber(5000000),
            creationDate: "2025-03-11T09:33:46.840Z",
            operations: [],
            operationsCount: 0,
            pendingOperations: [],
            swapHistory: [],
            balanceHistoryCache: emptyHistoryCache,
          },
        ],
      },
    } as unknown as AccountShapeInfo<AptosAccount>;

    const result = await getAccountShape(info, {} as SyncConfig);

    const stakingEnabled = getEnv("APTOS_ENABLE_STAKING") === true;
    if (stakingEnabled) {
      expect(result.aptosResources?.stakingPositions).toHaveLength(1);

      const position = result.aptosResources?.stakingPositions?.[0];
      expect(position).toEqual({
        active: BigNumber(mockDelegatorBalance[0]),
        inactive: BigNumber(mockDelegatorBalance[1]),
        pendingInactive: BigNumber(mockDelegatorBalance[2]),
        validatorId: stakingOperations[0].recipients[0],
      });

      expect(result.aptosResources?.activeBalance).toEqual(BigNumber(mockDelegatorBalance[0]));
      expect(result.aptosResources?.inactiveBalance).toEqual(BigNumber(mockDelegatorBalance[1]));
      expect(result.aptosResources?.pendingInactiveBalance).toEqual(
        BigNumber(mockDelegatorBalance[2]),
      );
    }
  });
});
