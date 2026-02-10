import { EntryFunctionPayloadResponse } from "@aptos-labs/ts-sdk";
import { decodeTokenAccountId, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import BigNumber from "bignumber.js";
import {
  createFixtureAccount,
  createFixtureAccountWithSubAccount,
} from "../../bridge/bridge.fixture";
import { getMaxSendBalance, getBlankOperation, txsToOps } from "../../bridge/logic";
import { APTOS_COIN_CHANGE, OP_TYPE } from "../../constants";
import { normalizeTransactionOptions } from "../../logic/normalizeTransactionOptions";
import type { AptosTransaction, TransactionOptions } from "../../types";

jest.mock("@ledgerhq/cryptoassets");
jest.mock("@ledgerhq/coin-framework/account/index");

setupMockCryptoAssetsStore();

describe("Aptos logic ", () => {
  describe("getMaxSendBalance", () => {
    it("should return the correct max send balance when amount is greater than total gas", () => {
      const amount = new BigNumber(1000000);
      const account = createFixtureAccount({ balance: amount, spendableBalance: amount });
      const gas = new BigNumber(200);
      const gasPrice = new BigNumber(100);
      const result = getMaxSendBalance(account, undefined, gas, gasPrice);
      expect(result.isEqualTo(amount.minus(gas.multipliedBy(gasPrice)))).toBe(true);
    });

    it("should return zero when amount is less than total gas", () => {
      const account = createFixtureAccount();
      const gas = new BigNumber(200);
      const gasPrice = new BigNumber(100);
      const result = getMaxSendBalance(account, undefined, gas, gasPrice);
      expect(result.isEqualTo(new BigNumber(0))).toBe(true);
    });

    it("should return zero when amount is equal to total gas", () => {
      const account = createFixtureAccount();
      const gas = new BigNumber(200);
      const gasPrice = new BigNumber(100);
      const result = getMaxSendBalance(account, undefined, gas, gasPrice);
      expect(result.isEqualTo(new BigNumber(0))).toBe(true);
    });

    it("should handle zero amount", () => {
      const account = createFixtureAccount();
      const gas = new BigNumber(200);
      const gasPrice = new BigNumber(100);
      const result = getMaxSendBalance(account, undefined, gas, gasPrice);
      expect(result.isEqualTo(new BigNumber(0))).toBe(true);
    });

    it("should handle zero gas and gas price", () => {
      const amount = new BigNumber(1000000);
      const account = createFixtureAccount({ balance: amount, spendableBalance: amount });
      const gas = new BigNumber(0);
      const gasPrice = new BigNumber(0);
      const result = getMaxSendBalance(account, undefined, gas, gasPrice);
      expect(result.isEqualTo(amount)).toBe(true);
    });

    it("should return max spendable amount for the token account", () => {
      const account = createFixtureAccountWithSubAccount("coin");
      const gas = new BigNumber(200);
      const gasPrice = new BigNumber(100);
      const result = getMaxSendBalance(account.subAccounts![0], account, gas, gasPrice);
      expect(result.isEqualTo(BigNumber(1000))).toBe(true);
    });
  });

  describe("normalizeTransactionOptions", () => {
    it("should normalize transaction options", () => {
      const options: TransactionOptions = {
        maxGasAmount: "1000",
        gasUnitPrice: "10",
      };

      const result = normalizeTransactionOptions(options);
      expect(result).toEqual(options);
    });

    it("should return undefined for empty values", () => {
      const options: TransactionOptions = {
        maxGasAmount: "",
        gasUnitPrice: "",
      };

      const result = normalizeTransactionOptions(options);
      expect(result).toEqual({
        maxGasAmount: undefined,
        gasUnitPrice: undefined,
      });
    });
  });

  describe("getBlankOperation", () => {
    it("should return a blank operation", () => {
      const tx: AptosTransaction = {
        hash: "0x123",
        block: { hash: "0xabc", height: 1 },
        timestamp: "1000000",
        sequence_number: "1",
        version: "1",
      } as unknown as AptosTransaction;

      const id = "test_id";
      const result = getBlankOperation(tx, id);

      expect(result).toEqual({
        id: "",
        hash: "0x123",
        type: "",
        value: new BigNumber(0),
        fee: new BigNumber(0),
        blockHash: "0xabc",
        blockHeight: 1,
        senders: [],
        recipients: [],
        accountId: id,
        date: new Date(1000),
        extra: { version: "1" },
        transactionSequenceNumber: new BigNumber(1),
        hasFailed: false,
      });
    });

    it("should return a blank operation even when some transaction fields are missing", () => {
      const tx: AptosTransaction = {
        hash: "0x123",
        timestamp: "1000000",
        sequence_number: "1",
      } as unknown as AptosTransaction;

      const id = "test_id";
      const result = getBlankOperation(tx, id);

      expect(result).toEqual({
        id: "",
        hash: "0x123",
        type: "",
        value: new BigNumber(0),
        fee: new BigNumber(0),
        blockHash: undefined,
        blockHeight: undefined,
        senders: [],
        recipients: [],
        accountId: id,
        date: new Date(1000),
        extra: { version: undefined },
        transactionSequenceNumber: new BigNumber(1),
        hasFailed: false,
      });
    });
  });
});

describe("Aptos sync logic ", () => {
  describe("txsToOps", () => {
    it("should convert Aptos transactions to operations correctly", async () => {
      const address = "0x11";
      const id = "test_id";
      const txs: AptosTransaction[] = [
        {
          hash: "0x123",
          sender: "0x11",
          gas_used: "200",
          gas_unit_price: "100",
          success: true,
          payload: {
            type: "entry_function_payload",
            function: "0x1::coin::transfer",
            type_arguments: [],
            arguments: ["0x12", 100],
          } as EntryFunctionPayloadResponse,
          events: [
            {
              type: "0x1::coin::WithdrawEvent",
              guid: {
                account_address: "0x11",
                creation_number: "1",
              },
              data: {
                amount: "100",
              },
            },
            {
              type: "0x1::coin::DepositEvent",
              guid: {
                account_address: "0x12",
                creation_number: "2",
              },
              data: {
                amount: "100",
              },
            },
          ],
          changes: [
            {
              type: "write_resource",
              data: {
                type: APTOS_COIN_CHANGE,
                data: {
                  withdraw_events: {
                    guid: {
                      id: {
                        addr: "0x11",
                        creation_num: "1",
                      },
                    },
                  },
                  deposit_events: {
                    guid: {
                      id: {
                        addr: "0x12",
                        creation_num: "2",
                      },
                    },
                  },
                },
              },
            },
          ],
          block: { hash: "0xabc", height: 1 },
          timestamp: "1000000",
          sequence_number: "1",
        } as unknown as AptosTransaction,
      ];

      const [result] = await txsToOps({ address }, id, txs);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: expect.any(String),
        hash: "0x123",
        type: OP_TYPE.OUT,
        value: new BigNumber(100),
        fee: new BigNumber(20000),
        blockHash: "0xabc",
        blockHeight: 1,
        senders: ["0x11"],
        recipients: ["0x0000000000000000000000000000000000000000000000000000000000000012"],
        accountId: id,
        date: new Date(1000),
        extra: { version: undefined },
        transactionSequenceNumber: new BigNumber(1),
        hasFailed: false,
      });
    });

    it("should skip transactions without functions in payload", async () => {
      const address = "0x11";
      const id = "test_id";
      const txs: AptosTransaction[] = [
        {
          hash: "0x123",
          sender: "0x11",
          gas_used: "200",
          gas_unit_price: "100",
          success: true,
          payload: {} as EntryFunctionPayloadResponse,
          events: [],
          changes: [],
          block: { hash: "0xabc", height: 1 },
          timestamp: "1000000",
          sequence_number: "1",
        } as unknown as AptosTransaction,
      ];

      const [result] = await txsToOps({ address }, id, txs);

      expect(result).toHaveLength(0);
    });

    it("should skip transactions that result in no Aptos change", async () => {
      const address = "0x11";
      const id = "test_id";
      const txs: AptosTransaction[] = [
        {
          hash: "0x123",
          sender: "0x12",
          gas_used: "200",
          gas_unit_price: "100",
          success: true,
          payload: {
            type: "entry_function_payload",
            function: "0x1::coin::transfer",
            type_arguments: [],
            arguments: ["0x11", 100],
          } as EntryFunctionPayloadResponse,
          events: [],
          changes: [],
          block: { hash: "0xabc", height: 1 },
          timestamp: "1000000",
          sequence_number: "1",
        } as unknown as AptosTransaction,
      ];

      const [result] = await txsToOps({ address }, id, txs);

      expect(result).toHaveLength(0);
    });

    it("should handle failed transactions", async () => {
      const address = "0xa0d8";
      const id = "test_id";
      const txs: AptosTransaction[] = [
        {
          hash: "0x0189",
          sender: "0xa0d8",
          gas_used: "200",
          gas_unit_price: "100",
          success: false,
          payload: {
            function: "0x1::coin::transfer",
            type_arguments: ["0xd111::staked_coin::StakedAptos"],
            arguments: ["0x4e5e", "50000000"],
            type: "entry_function_payload",
          } as EntryFunctionPayloadResponse,
          events: [
            {
              guid: {
                creation_number: "0",
                account_address: "0x0",
              },
              sequence_number: "0",
              type: "0x1::transaction_fee::FeeStatement",
              data: {
                execution_gas_units: "5",
                io_gas_units: "4",
                storage_fee_octas: "0",
                storage_fee_refund_octas: "0",
                total_charge_gas_units: "8",
              },
            },
          ],
          changes: [
            {
              address: "0xa0d8",
              state_key_hash: "0x1709",
              data: {
                type: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
                data: {
                  coin: {
                    value: "573163341",
                  },
                  deposit_events: {
                    counter: "45",
                    guid: {
                      id: {
                        addr: "0xa0d8",
                        creation_num: "2",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "82",
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
                  sequence_number: "83",
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
              value: "0x72c5e483c25c96010000000000000000",
              data: null,
              type: "write_table_item",
            },
          ],
          block: {
            hash: "0xc496",
            height: 1,
          },
          timestamp: "1000000",
          sequence_number: "1",
        } as unknown as AptosTransaction,
      ];

      const [result] = await txsToOps({ address }, id, txs);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: expect.any(String),
        hash: "0x0189",
        type: OP_TYPE.OUT,
        value: new BigNumber(20000),
        fee: new BigNumber(20000),
        blockHash: "0xc496",
        blockHeight: 1,
        senders: ["0xa0d8"],
        recipients: ["0x0000000000000000000000000000000000000000000000000000000000004e5e"],
        accountId: id,
        date: new Date(1000),
        extra: { version: undefined },
        transactionSequenceNumber: new BigNumber(1),
        hasFailed: true,
      });
    });

    it("should convert Aptos token transactions to operations correctly", async () => {
      (encodeTokenAccountId as jest.Mock).mockReturnValue("token_account_id");
      setupMockCryptoAssetsStore({
        findTokenByAddressInCurrency: async (address: string, _currencyId: string) => {
          // coin_id is converted to lowercase in txsToOps
          if (address === "0xd111::staked_coin::stakedaptos") {
            return {
              type: "TokenCurrency" as const,
              id: "aptos/coin/dstapt::staked_coin::stakedaptos",
              contractAddress: "0xd111::staked_coin::StakedAptos",
              parentCurrency: getCryptoCurrencyById("aptos"),
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
            };
          }
          return undefined;
        },
        getTokensSyncHash: async () => "0",
      });

      jest.mock("../../bridge/logic", () => ({
        ...jest.requireActual("../../bridge/logic"),
        getResourceAddress: jest.fn().mockReturnValue("0xd111::staked_coin::StakedAptos"),
      }));

      (decodeTokenAccountId as jest.Mock).mockReturnValue({
        accountId: "token_account_id",
      });

      const address = "0xa0d";
      const id = "test_id";
      const txs: AptosTransaction[] = [
        {
          hash: "0x123",
          sender: address,
          gas_used: "200",
          gas_unit_price: "100",
          success: true,
          payload: {
            function: "0x1::aptos_account::transfer_coins",
            type_arguments: ["0xd111::staked_coin::StakedAptos"],
            arguments: ["0x4e5", "1500000"],
            type: "entry_function_payload",
          } as EntryFunctionPayloadResponse,
          events: [
            {
              guid: {
                creation_number: "11",
                account_address: "0xa0d",
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
                account_address: "0x4e5",
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
          changes: [
            {
              address: "0x4e5",
              state_key_hash: "0x3c0",
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
                        addr: "0x4e5",
                        creation_num: "4",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "6",
                    guid: {
                      id: {
                        addr: "0x4e5",
                        creation_num: "5",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d",
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
                        addr: "0xa0d",
                        creation_num: "2",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "89",
                    guid: {
                      id: {
                        addr: "0xa0d",
                        creation_num: "3",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d",
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
                        addr: "0xa0d",
                        creation_num: "10",
                      },
                    },
                  },
                  frozen: false,
                  withdraw_events: {
                    counter: "13",
                    guid: {
                      id: {
                        addr: "0xa0d",
                        creation_num: "11",
                      },
                    },
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xa0d",
              state_key_hash: "0x6f1e",
              data: {
                type: "0x1::account::Account",
                data: {
                  authentication_key: "0xa0d",
                  coin_register_events: {
                    counter: "5",
                    guid: {
                      id: {
                        addr: "0xa0d",
                        creation_num: "0",
                      },
                    },
                  },
                  guid_creation_num: "12",
                  key_rotation_events: {
                    counter: "0",
                    guid: {
                      id: {
                        addr: "0xa0d",
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
          block: { hash: "0xabc", height: 1 },
          timestamp: "1000000",
          sequence_number: "1",
        } as unknown as AptosTransaction,
      ];

      const [ops, tokenOps] = await txsToOps({ address }, id, txs);

      expect(ops).toHaveLength(1);
      expect(ops[0]).toEqual({
        id: expect.any(String),
        hash: "0x123",
        type: "FEES",
        value: new BigNumber(20000),
        fee: new BigNumber(20000),
        blockHash: "0xabc",
        blockHeight: 1,
        senders: ["0xa0d"],
        recipients: ["0x00000000000000000000000000000000000000000000000000000000000004e5"],
        accountId: "token_account_id",
        date: new Date(1000),
        extra: { version: undefined },
        transactionSequenceNumber: new BigNumber(1),
        hasFailed: false,
      });

      expect(tokenOps).toHaveLength(1);
      expect(tokenOps[0]).toEqual({
        id: expect.any(String),
        accountId: "token_account_id",
        hash: "0x123",
        type: OP_TYPE.OUT,
        value: new BigNumber(1500000),
        fee: new BigNumber(20000),
        blockHash: "0xabc",
        blockHeight: 1,
        senders: ["0xa0d"],
        recipients: ["0x00000000000000000000000000000000000000000000000000000000000004e5"],
        date: new Date(1000),
        extra: { version: undefined },
        transactionSequenceNumber: new BigNumber(1),
        hasFailed: false,
      });
    });

    it("should convert Aptos token transactions to operations correctly", async () => {
      setupMockCryptoAssetsStore({
        findTokenByAddressInCurrency: async (address: string, _currencyId: string) => {
          if (address === "0x2ebb") {
            return {
              type: "TokenCurrency" as const,
              id: "aptos/fungible_asset/cellana_0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12",
              contractAddress: "0x2ebb",
              parentCurrency: getCryptoCurrencyById("aptos"),
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
            };
          }
          return undefined;
        },
        getTokensSyncHash: async () => "0",
      });

      jest.mock("../../bridge/logic", () => ({
        ...jest.requireActual("../../bridge/logic"),
        getResourceAddress: jest.fn().mockReturnValue("0x2ebb"),
      }));

      (encodeTokenAccountId as jest.Mock).mockReturnValue("token_account_id");

      const txs: AptosTransaction[] = [
        {
          hash: "0x10c9",
          sender: "0xa0d8",
          gas_used: "200",
          gas_unit_price: "100",
          success: true,
          payload: {
            function: "0x1::primary_fungible_store::transfer",
            type_arguments: ["0x1::fungible_asset::Metadata"],
            arguments: [
              {
                inner: "0x2ebb",
              },
              "0x6b8c",
              "193",
            ],
            type: "entry_function_payload",
          } as EntryFunctionPayloadResponse,
          events: [
            {
              guid: {
                creation_number: "0",
                account_address: "0x0",
              },
              sequence_number: "0",
              type: "0x1::fungible_asset::Withdraw",
              data: {
                amount: "193",
                store: "0xd475",
              },
            },
            {
              guid: {
                creation_number: "0",
                account_address: "0x0",
              },
              sequence_number: "0",
              type: "0x1::fungible_asset::Deposit",
              data: {
                amount: "193",
                store: "0xaaa9",
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
                execution_gas_units: "4",
                io_gas_units: "6",
                storage_fee_octas: "0",
                storage_fee_refund_octas: "0",
                total_charge_gas_units: "10",
              },
            },
          ],
          changes: [
            {
              address: "0xaaa9",
              state_key_hash: "0x9a17",
              data: {
                type: "0x1::fungible_asset::FungibleStore",
                data: {
                  balance: "10044959",
                  frozen: false,
                  metadata: {
                    inner: "0x2ebb",
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xaaa9",
              state_key_hash: "0x9a17",
              data: {
                type: "0x1::object::ObjectCore",
                data: {
                  allow_ungated_transfer: false,
                  guid_creation_num: "1125899906842625",
                  owner: "0x6b8c",
                  transfer_events: {
                    counter: "0",
                    guid: {
                      id: {
                        addr: "0xaaa9",
                        creation_num: "1125899906842624",
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
                    value: "98423118",
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
                    counter: "88",
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
                  sequence_number: "108",
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
              address: "0xd475",
              state_key_hash: "0x7567",
              data: {
                type: "0x1::fungible_asset::FungibleStore",
                data: {
                  balance: "14000",
                  frozen: false,
                  metadata: {
                    inner: "0x2ebb",
                  },
                },
              },
              type: "write_resource",
            },
            {
              address: "0xd475",
              state_key_hash: "0x7567",
              data: {
                type: "0x1::object::ObjectCore",
                data: {
                  allow_ungated_transfer: false,
                  guid_creation_num: "1125899906842625",
                  owner: "0xa0d8",
                  transfer_events: {
                    counter: "0",
                    guid: {
                      id: {
                        addr: "0xd475",
                        creation_num: "1125899906842624",
                      },
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
              value: "0xad4388dc7daf96010000000000000000",
              data: null,
              type: "write_table_item",
            },
          ],
          block: { hash: "0xabc", height: 1 },
          timestamp: "1000000",
          sequence_number: "1",
        } as unknown as AptosTransaction,
      ];

      const [ops, tokenOps] = await txsToOps({ address: "0x6b8c" }, "test_id", txs);

      expect(ops).toHaveLength(0);

      expect(tokenOps).toHaveLength(1);
      expect(tokenOps[0]).toEqual({
        id: expect.any(String),
        accountId: "token_account_id",
        hash: "0x10c9",
        type: OP_TYPE.IN,
        value: new BigNumber(193),
        fee: new BigNumber(20000),
        blockHash: "0xabc",
        blockHeight: 1,
        senders: ["0xa0d8"],
        recipients: ["0x0000000000000000000000000000000000000000000000000000000000006b8c"],
        date: new Date(1000),
        extra: { version: undefined },
        transactionSequenceNumber: new BigNumber(1),
        hasFailed: false,
      });
    });
  });
});
