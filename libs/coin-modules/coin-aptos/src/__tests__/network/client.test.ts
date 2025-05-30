import { ApolloClient } from "@apollo/client";
import {
  AccountAddress,
  Aptos,
  ChainId,
  Ed25519PublicKey,
  Hex,
  InputEntryFunctionData,
  RawTransaction,
  Serializable,
  postAptosFullNode,
  TransactionResponseType,
} from "@aptos-labs/ts-sdk";
import network from "@ledgerhq/live-network";
import BigNumber from "bignumber.js";
import { AptosAPI } from "../../network";
import { AptosAsset, AptosExtra, AptosSender } from "../../types/assets";
import { Pagination, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { APTOS_ASSET_ID } from "../../constants";
import { AptosTransaction } from "../../types";

jest.mock("@aptos-labs/ts-sdk");
jest.mock("@apollo/client");
let mockedAptos: jest.Mocked<any>;
let mockedApolloClient: jest.Mocked<any>;
let mockedPost = jest.fn();
let mockedHex: jest.Mocked<any>;

jest.mock("@ledgerhq/live-network/network");
const mockedNetwork = jest.mocked(network);

jest.mock("@ledgerhq/cryptoassets/tokens", () => ({
  findTokenByAddressInCurrency: jest.fn().mockReturnValue("token-name"),
}));

describe("Aptos API", () => {
  beforeEach(() => {
    mockedAptos = jest.mocked(Aptos);
    mockedHex = jest.mocked(Hex);
    mockedApolloClient = jest.mocked(ApolloClient);
    mockedPost = jest.mocked(postAptosFullNode);
  });

  afterEach(() => jest.clearAllMocks());

  it("builds the client properly for mainnet", () => {
    const api = new AptosAPI("aptos");

    expect(api.broadcast).toBeDefined();
    expect(typeof api.broadcast).toBe("function");
    expect(api.estimateGasPrice).toBeDefined();
    expect(typeof api.estimateGasPrice).toBe("function");
    expect(api.generateTransaction).toBeDefined();
    expect(typeof api.generateTransaction).toBe("function");
    expect(api.getAccount).toBeDefined();
    expect(typeof api.getAccount).toBe("function");
    expect(api.getAccountInfo).toBeDefined();
    expect(typeof api.getAccountInfo).toBe("function");
    expect(api.simulateTransaction).toBeDefined();
    expect(typeof api.simulateTransaction).toBe("function");
  });

  it("builds the client properly for testnet", () => {
    const api = new AptosAPI("aptos_testnet");

    expect(api.broadcast).toBeDefined();
    expect(typeof api.broadcast).toBe("function");
    expect(api.estimateGasPrice).toBeDefined();
    expect(typeof api.estimateGasPrice).toBe("function");
    expect(api.generateTransaction).toBeDefined();
    expect(typeof api.generateTransaction).toBe("function");
    expect(api.getAccount).toBeDefined();
    expect(typeof api.getAccount).toBe("function");
    expect(api.getAccountInfo).toBeDefined();
    expect(typeof api.getAccountInfo).toBe("function");
    expect(api.simulateTransaction).toBeDefined();
    expect(typeof api.simulateTransaction).toBe("function");
  });

  describe("getAccount", () => {
    it("calls getAccountInfo", async () => {
      const mockGetAccountInfo = jest.fn();
      mockedAptos.mockImplementation(() => ({
        getAccountInfo: mockGetAccountInfo,
      }));

      const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

      const api = new AptosAPI("aptos");
      await api.getAccount("address");

      expect(mockGetAccountSpy).toHaveBeenCalledWith({
        accountAddress: "address",
      });
    });
  });

  describe("getBalance", () => {
    let token: TokenCurrency;

    beforeEach(() => {
      token = {
        type: "TokenCurrency",
        id: "aptos_token",
        name: "Aptos Token",
        ticker: "APT",
        units: [{ name: "APT", code: "APT", magnitude: 6 }],
        contractAddress: "APTOS_1_ADDRESS",
        tokenType: "fungible_asset",
        parentCurrency: {
          type: "CryptoCurrency",
          id: "aptos",
          name: "Aptos",
          ticker: "APT",
          units: [{ name: "APT", code: "APT", magnitude: 6 }],
          color: "#000000",
          family: "aptos",
          scheme: "aptos",
          explorerViews: [],
          managerAppName: "Aptos",
          coinType: 637,
        },
      };
    });

    it("get coin balance", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockReturnValue(["1234"]),
      }));

      token.tokenType = "coin";
      const api = new AptosAPI("aptos");
      const balance = await api.getBalance("address", token);

      expect(balance).toEqual(new BigNumber(1234));
    });

    it("get fungible assets balance", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockReturnValue(["12345"]),
      }));

      token.tokenType = "fungible_asset";

      const api = new AptosAPI("aptos");
      const balance = await api.getBalance("address", token);

      expect(balance).toEqual(new BigNumber(12345));
    });

    it("return 0 balace if could not retrieve proper balance of fungible assets", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockImplementation(() => {
          throw new Error("error");
        }),
      }));

      token.tokenType = "fungible_asset";

      const api = new AptosAPI("aptos");
      const balance = await api.getBalance("address", token);

      expect(balance).toEqual(new BigNumber(0));
    });
  });

  describe("getAccountInfo", () => {
    it("calls getCoinBalance, fetchTransactions and getHeight", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockReturnValue(["123"]),
        getTransactionByVersion: jest.fn().mockReturnValue({
          type: "user_transaction",
          version: "v1",
        }),
        getBlockByVersion: jest.fn().mockReturnValue({
          block_height: "1",
          block_hash: "83ca6d",
        }),
      }));

      mockedNetwork.mockResolvedValue(
        Promise.resolve({
          data: {
            account: {
              account_number: 1,
              sequence: 0,
              pub_key: { key: "k", "@type": "type" },
              base_account: {
                account_number: 2,
                sequence: 42,
                pub_key: { key: "k2", "@type": "type2" },
              },
            },
            block_height: "999",
          },
          status: 200,
          headers: {} as any,
          statusText: "",
          config: {
            headers: {} as any,
          },
        }),
      );

      mockedApolloClient.mockImplementation(() => ({
        query: async () => ({
          data: {
            account_transactions: [{ transaction_version: 1 }],
          },
          loading: false,
          networkStatus: 7,
        }),
      }));

      const api = new AptosAPI("aptos");
      const accountInfo = await api.getAccountInfo("APTOS_1_ADDRESS", "1");

      expect(accountInfo.balance).toEqual(new BigNumber(123));
      expect(accountInfo.transactions).toEqual([
        {
          type: "user_transaction",
          version: "v1",
          block: {
            height: 1,
            hash: "83ca6d",
          },
        },
      ]);
      expect(accountInfo.blockHeight).toEqual(999);
    });

    it("return balance = 0 if it fails to fetch balance", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockImplementation(() => {
          throw new Error("error");
        }),
        getTransactionByVersion: jest.fn().mockReturnValue({
          type: "user_transaction",
          version: "v1",
        }),
        getBlockByVersion: jest.fn().mockReturnValue({
          block_height: "1",
          block_hash: "83ca6d",
        }),
      }));

      mockedNetwork.mockResolvedValue(
        Promise.resolve({
          data: {
            account: {
              account_number: 1,
              sequence: 0,
              pub_key: { key: "k", "@type": "type" },
              base_account: {
                account_number: 2,
                sequence: 42,
                pub_key: { key: "k2", "@type": "type2" },
              },
            },
            block_height: "999",
          },
          status: 200,
          headers: {} as any,
          statusText: "",
          config: {
            headers: {} as any,
          },
        }),
      );

      mockedApolloClient.mockImplementation(() => ({
        query: async () => ({
          data: {
            account_transactions: [{ transaction_version: 1 }],
          },
          loading: false,
          networkStatus: 7,
        }),
      }));

      const api = new AptosAPI("aptos");
      const accountInfo = await api.getAccountInfo("APTOS_1_ADDRESS", "1");

      expect(accountInfo.balance).toEqual(new BigNumber(0));
      expect(accountInfo.transactions).toEqual([
        {
          type: "user_transaction",
          version: "v1",
          block: {
            height: 1,
            hash: "83ca6d",
          },
        },
      ]);
      expect(accountInfo.blockHeight).toEqual(999);
    });

    it("returns no transactions if it the address is empty", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockReturnValue(["123"]),
        getTransactionByVersion: jest.fn().mockReturnValue({
          type: "user_transaction",
          version: "v1",
        }),
        getBlockByVersion: jest.fn().mockReturnValue({
          block_height: "1",
          block_hash: "83ca6d",
        }),
      }));

      mockedNetwork.mockResolvedValue(
        Promise.resolve({
          data: {
            account: {
              account_number: 1,
              sequence: 0,
              pub_key: { key: "k", "@type": "type" },
              base_account: {
                account_number: 2,
                sequence: 42,
                pub_key: { key: "k2", "@type": "type2" },
              },
            },
            block_height: "999",
          },
          status: 200,
          headers: {} as any,
          statusText: "",
          config: {
            headers: {} as any,
          },
        }),
      );

      mockedApolloClient.mockImplementation(() => ({
        query: async () => ({
          data: {
            account_transactions: [{ transaction_version: 1 }],
          },
          loading: false,
          networkStatus: 7,
        }),
      }));

      const api = new AptosAPI("aptos");
      const accountInfo = await api.getAccountInfo("", "1");

      expect(accountInfo.balance).toEqual(new BigNumber(123));
      expect(accountInfo.transactions).toEqual([]);
      expect(accountInfo.blockHeight).toEqual(999);
    });

    it("returns a null transaction if it fails to getTransactionByVersion", async () => {
      mockedAptos.mockImplementation(() => ({
        view: jest.fn().mockReturnValue(["123"]),
        getTransactionByVersion: jest.fn().mockImplementation(() => {
          throw new Error("error");
        }),
        getBlockByVersion: jest.fn().mockReturnValue({
          block_height: "1",
          block_hash: "83ca6d",
        }),
      }));

      mockedNetwork.mockResolvedValue(
        Promise.resolve({
          data: {
            account: {
              account_number: 1,
              sequence: 0,
              pub_key: { key: "k", "@type": "type" },
              base_account: {
                account_number: 2,
                sequence: 42,
                pub_key: { key: "k2", "@type": "type2" },
              },
            },
            block_height: "999",
          },
          status: 200,
          headers: {} as any,
          statusText: "",
          config: {
            headers: {} as any,
          },
        }),
      );

      mockedApolloClient.mockImplementation(() => ({
        query: async () => ({
          data: {
            account_transactions: [{ transaction_version: 1 }],
          },
          loading: false,
          networkStatus: 7,
        }),
      }));

      const api = new AptosAPI("aptos");
      const accountInfo = await api.getAccountInfo("APTOS_1_ADDRESS", "1");

      expect(accountInfo.balance).toEqual(new BigNumber(123));
      expect(accountInfo.transactions).toEqual([null]);
      expect(accountInfo.blockHeight).toEqual(999);
    });
  });

  describe("estimateGasPrice", () => {
    it("estimates the gas price", async () => {
      const gasEstimation = { gas_estimate: 100 };
      mockedAptos.mockImplementation(() => ({
        getGasPriceEstimation: jest.fn().mockReturnValue(gasEstimation),
      }));

      const api = new AptosAPI("aptos");
      const gasPrice = await api.estimateGasPrice();

      expect(gasPrice.gas_estimate).toEqual(100);
    });
  });

  describe("generateTransaction", () => {
    const payload: InputEntryFunctionData = {
      function: "0x1::coin::transfer",
      functionArguments: ["0x13", 1],
    };

    it("generates a transaction without expireTimestamp", async () => {
      const options = {
        maxGasAmount: "100",
        gasUnitPrice: "50",
      };

      const mockSimple = jest.fn().mockImplementation(async () => ({
        rawTransaction: null,
      }));
      mockedAptos.mockImplementation(() => ({
        transaction: {
          build: {
            simple: mockSimple,
          },
        },
      }));

      const mockSimpleSpy = jest.spyOn({ simple: mockSimple }, "simple");

      const api = new AptosAPI("aptos");
      await api.generateTransaction("APTOS_1_ADDRESS", payload, options);

      expect(mockSimpleSpy).toHaveBeenCalledWith({
        data: payload,
        options: {
          maxGasAmount: Number(options.maxGasAmount),
          gasUnitPrice: Number(options.gasUnitPrice),
        },
        sender: "APTOS_1_ADDRESS",
      });
    });

    it("generates a transaction with default expireTimestamp", async () => {
      const options = {
        maxGasAmount: "100",
        gasUnitPrice: "50",
      };

      const mockSimple = jest.fn().mockImplementation(async () => ({
        rawTransaction: null,
      }));
      const mockGetLedgerInfo = jest.fn().mockImplementation(async () => ({
        ledger_timestamp: "0",
      }));
      mockedAptos.mockImplementation(() => ({
        transaction: {
          build: {
            simple: mockSimple,
          },
        },
        getLedgerInfo: mockGetLedgerInfo,
      }));

      const mockSimpleSpy = jest.spyOn({ simple: mockSimple }, "simple");

      const api = new AptosAPI("aptos");
      await api.generateTransaction("APTOS_1_ADDRESS", payload, options);

      expect(mockSimpleSpy).toHaveBeenCalledWith({
        data: payload,
        options: {
          maxGasAmount: Number(options.maxGasAmount),
          gasUnitPrice: Number(options.gasUnitPrice),
          expireTimestamp: 120,
        },
        sender: "APTOS_1_ADDRESS",
      });
    });

    it("throws an error when failing to build a transaction", async () => {
      const options = {
        maxGasAmount: "100",
        gasUnitPrice: "50",
      };

      const mockSimple = jest.fn().mockImplementation(async () => null);
      mockedAptos.mockImplementation(() => ({
        transaction: {
          build: {
            simple: mockSimple,
          },
        },
      }));

      const api = new AptosAPI("aptos");
      expect(
        async () => await api.generateTransaction("APTOS_1_ADDRESS", payload, options),
      ).rejects.toThrow();
    });
  });

  describe("simulateTransaction", () => {
    it("simulates a transaction with the correct options", async () => {
      const mockSimple = jest.fn().mockImplementation(async () => ({
        rawTransaction: null,
      }));
      mockedAptos.mockImplementation(() => ({
        transaction: {
          simulate: {
            simple: mockSimple,
          },
        },
      }));

      const mockSimpleSpy = jest.spyOn({ simple: mockSimple }, "simple");

      const api = new AptosAPI("aptos");
      const address = new Ed25519PublicKey("APTOS_1_ADDRESS");
      const tx = new RawTransaction(
        new AccountAddress(Uint8Array.from(Buffer.from("APTOS_2_ADDRESS"))),
        BigInt(1),
        "" as unknown as Serializable,
        BigInt(100),
        BigInt(50),
        BigInt(1),
        { chainId: 1 } as ChainId,
      );
      await api.simulateTransaction(address, tx);

      expect(mockSimpleSpy).toHaveBeenCalledWith({
        signerPublicKey: address,
        transaction: { rawTransaction: tx },
        options: {
          estimateGasUnitPrice: true,
          estimateMaxGasAmount: true,
          estimatePrioritizedGasUnitPrice: false,
        },
      });
    });
  });

  describe("broadcast", () => {
    it("broadcasts the transaction", async () => {
      mockedPost.mockImplementation(async () => ({ data: { hash: "ok" } }));
      const mockedPostSpy = jest.spyOn({ postAptosFullNode: mockedPost }, "postAptosFullNode");

      // const txBytes = Hex.fromHexString(tx).toUint8Array();
      mockedAptos.mockImplementation(() => ({
        config: "config",
      }));

      mockedHex.fromHexString = jest.fn().mockReturnValue({ toUint8Array: () => "123" });

      const api = new AptosAPI("aptos");

      await api.broadcast("signed transaction");

      expect(mockedPostSpy).toHaveBeenCalledWith({
        aptosConfig: "config",
        body: "123",
        path: "transactions",
        originMethod: "",
        contentType: "application/x.aptos.signed_transaction+bcs",
      });
    });
  });

  describe("estimateFees", () => {
    it("estimates the fees", async () => {
      const gasEstimation = { gas_estimate: 100 };
      mockedAptos.mockImplementation(() => ({
        getLedgerInfo: jest.fn().mockResolvedValue({
          ledger_timestamp: Date.now(),
        }),
        transaction: {
          build: {
            simple: jest.fn().mockResolvedValue({ rawTransaction: {} }),
          },
          simulate: {
            simple: jest.fn().mockResolvedValue([
              {
                gas_used: 10,
                gas_unit_price: 4,
              },
            ]),
          },
        },
        getGasPriceEstimation: jest.fn().mockReturnValue(gasEstimation),
      }));

      const amount = BigInt(100);
      const sender: AptosSender = {
        xpub: "xpub",
        freshAddress: "address1",
      };
      const recipient = "address2";

      const api = new AptosAPI("aptos");
      const transactionIntent: TransactionIntent<AptosAsset, AptosExtra, AptosSender> = {
        asset: {
          type: "native",
        },
        type: "send",
        sender,
        amount,
        recipient,
      };

      const fees = await api.estimateFees(transactionIntent);

      expect(fees.value.toString()).toEqual("40");
    });
  });

  describe("getBalances", () => {
    it("returns an array of AptosBalances objects", async () => {
      const assets = [{ asset_type: APTOS_ASSET_ID, amount: 200 }];
      const mockGetCurrentFungibleAssetBalances = jest.fn().mockResolvedValue(assets);
      mockedAptos.mockImplementation(() => ({
        getCurrentFungibleAssetBalances: mockGetCurrentFungibleAssetBalances,
      }));

      const address = "0x42";

      const api = new AptosAPI("aptos");
      const balances = await api.getBalances(address);

      expect(mockGetCurrentFungibleAssetBalances).toHaveBeenCalledWith({
        options: {
          offset: 0,
          limit: 1000,
          where: {
            asset_type: { _eq: APTOS_ASSET_ID },
            owner_address: { _eq: address },
          },
        },
      });
      expect(balances).toHaveLength(1);
      expect(balances[0].contractAddress).toBe(assets[0].asset_type);
      expect(balances[0].amount).toStrictEqual(BigNumber(assets[0].amount));
    });
  });

  describe("listOperations", () => {
    it("list of operations", async () => {
      const api = new AptosAPI("aptos");
      const address = "0x12345";
      const pagination: Pagination = { minHeight: 0 };

      const txs: AptosTransaction[] = [
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
              address: address,
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
                        addr: address,
                        creation_num: "2",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "89",
                    guid: {
                      id: {
                        addr: address,
                        creation_num: "3",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: address,
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
                        addr: address,
                        creation_num: "10",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "13",
                    guid: {
                      id: {
                        addr: address,
                        creation_num: "11",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: address,
              state_key_hash: "0x6f1e",
              data: {
                type: "0x1::account::Account",
                data: {
                  authentication_key: address,
                  coin_register_events: {
                    counter: "5",
                    guid: {
                      id: {
                        addr: address,
                        creation_num: "0",
                      },
                    },
                  },
                  guid_creation_num: "12",
                  key_rotation_events: {
                    counter: "0",
                    guid: {
                      id: {
                        addr: address,
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
              type: "write_table_item",
            },
          ],
          sender: address,
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
          events: [
            {
              guid: {
                creation_number: "11",
                account_address: address,
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
          type: TransactionResponseType.User,
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
              address: address,
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
                        addr: address,
                        creation_num: "2",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "89",
                    guid: {
                      id: {
                        addr: address,
                        creation_num: "3",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: address,
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
                        addr: address,
                        creation_num: "10",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "12",
                    guid: {
                      id: {
                        addr: address,
                        creation_num: "11",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: address,
              state_key_hash: "0x6f1e",
              data: {
                type: "0x1::account::Account",
                data: {
                  authentication_key: address,
                  coin_register_events: {
                    counter: "5",
                    guid: {
                      id: {
                        addr: address,
                        creation_num: "0",
                      },
                    },
                  },
                  guid_creation_num: "12",
                  key_rotation_events: {
                    counter: "0",
                    guid: {
                      id: {
                        addr: address,
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
              type: "write_table_item",
            },
          ],
          sender: address,
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
          events: [
            {
              guid: {
                creation_number: "11",
                account_address: address,
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
          type: TransactionResponseType.User,
          block: {
            height: 311942427,
            hash: "0x8655",
          },
        },
      ];

      const transactions: AptosTransaction[] = txs;

      api.getAccountInfo = jest.fn().mockResolvedValue({ transactions });

      const ops = await api.listOperations(address, pagination);

      expect(ops[0]).toHaveLength(2);
      expect(ops[1]).toBe("");
    });
  });
});
