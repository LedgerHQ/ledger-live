import {
  EntryFunctionPayloadResponse,
  Event,
  InputEntryFunctionData,
  WriteSetChange,
} from "@aptos-labs/ts-sdk";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  APTOS_ASSET_ID,
  APTOS_COIN_CHANGE,
  APTOS_FUNGIBLE_STORE,
  APTOS_OBJECT_CORE,
  DIRECTION,
} from "../../constants";
import {
  calculateAmount,
  compareAddress,
  getCoinAndAmounts,
  getFunctionAddress,
  getResourceAddress,
  isTestnet,
  processRecipients,
  getMaxSendBalance,
  normalizeTransactionOptions,
  getBlankOperation,
  txsToOps,
  getEventCoinAddress,
  getEventFAAddress,
} from "../../bridge/logic";
import type { AptosTransaction, TransactionOptions } from "../../types";

describe("Aptos logic ", () => {
  describe("isTestnet", () => {
    it("should return true for testnet currencies", () => {
      expect(isTestnet("aptos_testnet")).toBe(true);
    });

    it("should return false for mainnet currencies", () => {
      expect(isTestnet("aptos")).toBe(false);
    });
  });

  describe("getMaxSendBalance", () => {
    it("should return the correct max send balance when amount is greater than total gas", () => {
      const amount = new BigNumber(1000000);
      const gas = new BigNumber(200);
      const gasPrice = new BigNumber(100);
      const result = getMaxSendBalance(amount, gas, gasPrice);
      expect(result.isEqualTo(amount.minus(gas.multipliedBy(gasPrice)))).toBe(true);
    });

    it("should return zero when amount is less than total gas", () => {
      const amount = new BigNumber(1000);
      const gas = new BigNumber(200);
      const gasPrice = new BigNumber(100);
      const result = getMaxSendBalance(amount, gas, gasPrice);
      expect(result.isEqualTo(new BigNumber(0))).toBe(true);
    });

    it("should return zero when amount is equal to total gas", () => {
      const amount = new BigNumber(20000);
      const gas = new BigNumber(200);
      const gasPrice = new BigNumber(100);
      const result = getMaxSendBalance(amount, gas, gasPrice);
      expect(result.isEqualTo(new BigNumber(0))).toBe(true);
    });

    it("should handle zero amount", () => {
      const amount = new BigNumber(0);
      const gas = new BigNumber(200);
      const gasPrice = new BigNumber(100);
      const result = getMaxSendBalance(amount, gas, gasPrice);
      expect(result.isEqualTo(new BigNumber(0))).toBe(true);
    });

    it("should handle zero gas and gas price", () => {
      const amount = new BigNumber(1000000);
      const gas = new BigNumber(0);
      const gasPrice = new BigNumber(0);
      const result = getMaxSendBalance(amount, gas, gasPrice);
      expect(result.isEqualTo(amount)).toBe(true);
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

      const id = "test-id";
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
        transactionSequenceNumber: 1,
        hasFailed: false,
      });
    });

    it("should return a blank operation even when some transaction fields are missing", () => {
      const tx: AptosTransaction = {
        hash: "0x123",
        timestamp: "1000000",
        sequence_number: "1",
      } as unknown as AptosTransaction;

      const id = "test-id";
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
        transactionSequenceNumber: 1,
        hasFailed: false,
      });
    });
  });
});

describe("Aptos sync logic ", () => {
  describe("compareAddress", () => {
    it("should return true for identical addresses", () => {
      const addressA = "0x1234567890abcdef";
      const addressB = "0x1234567890abcdef";
      expect(compareAddress(addressA, addressB)).toBe(true);
    });

    it("should return true for addresses with different cases", () => {
      const addressA = "0x1234567890abcdef";
      const addressB = "0x1234567890ABCDEF";
      expect(compareAddress(addressA, addressB)).toBe(true);
    });

    it("should return true for addresses with different hex formats", () => {
      const addressA = "0x1234567890abcdef";
      const addressB = "1234567890abcdef";
      expect(compareAddress(addressA, addressB)).toBe(true);
    });

    it("should return false for different addresses", () => {
      const addressA = "0x1234567890abcdef";
      const addressB = "0xfedcba0987654321";
      expect(compareAddress(addressA, addressB)).toBe(false);
    });
  });

  describe("getFunctionAddress", () => {
    it("should return the function address when payload contains a function", () => {
      const payload: InputEntryFunctionData = {
        function: "0x1::coin::transfer",
        typeArguments: [],
        functionArguments: [],
      };

      const result = getFunctionAddress(payload);
      expect(result).toBe("0x1");
    });

    it("should return undefined when payload does not contain a function", () => {
      const payload = {
        function: "::::",
        typeArguments: [],
        functionArguments: [],
      } as InputEntryFunctionData;

      const result = getFunctionAddress(payload);
      expect(result).toBeUndefined();
    });

    it("should return undefined when payload is empty", () => {
      const payload = {} as InputEntryFunctionData;

      const result = getFunctionAddress(payload);
      expect(result).toBeUndefined();
    });
  });

  describe("processRecipients", () => {
    let op: Operation;

    beforeEach(() => {
      op = {
        id: "",
        hash: "",
        type: "" as OperationType,
        value: new BigNumber(0),
        fee: new BigNumber(0),
        blockHash: "",
        blockHeight: 0,
        senders: [],
        recipients: [],
        accountId: "",
        date: new Date(),
        extra: {},
        transactionSequenceNumber: 0,
        hasFailed: false,
      };
    });

    it("should add recipient for transfer-like functions from LL account", () => {
      const payload: InputEntryFunctionData = {
        function: "0x1::coin::transfer",
        typeArguments: [],
        functionArguments: ["0x13", 1], // from: &signer, to: address, amount: u64
      };

      processRecipients(payload, "0x13", op, "0x1");
      expect(op.recipients).toContain("0x13");
    });

    it("should add recipient for transfer-like functions from external account", () => {
      const payload: InputEntryFunctionData = {
        function: "0x1::coin::transfer",
        typeArguments: [],
        functionArguments: ["0x12", 1], // from: &signer, to: address, amount: u64
      };

      processRecipients(payload, "0x13", op, "0x1");
      expect(op.recipients).toContain("0x12");
    });

    it("should add recipients for batch transfer functions", () => {
      const payload: InputEntryFunctionData = {
        function: "0x1::aptos_account::batch_transfer_coins",
        typeArguments: [APTOS_ASSET_ID],
        functionArguments: [
          ["0x12", "0x13"],
          [1, 2],
        ],
      };

      op.senders.push("0x11");
      processRecipients(payload, "0x12", op, "0x1");
      expect(op.recipients).toContain("0x12");
    });

    it("should add function address as recipient for other smart contracts", () => {
      const payload: InputEntryFunctionData = {
        function: "0x2::other::contract",
        typeArguments: [],
        functionArguments: [["0x12"], [1]],
      };

      processRecipients(payload, "0x11", op, "0x2");
      expect(op.recipients).toContain("0x2");
    });
  });

  describe("getResourceAddress", () => {
    it("should return coin name from the change", () => {
      const change = {
        type: "write_resource",
        data: {
          type: APTOS_COIN_CHANGE,
          data: {
            withdraw_events: {
              guid: {
                id: {
                  addr: "0x11",
                  creation_num: "2",
                },
              },
            },
          },
        },
      } as unknown as WriteSetChange;

      const tx: AptosTransaction = {
        hash: "0x123",
        block: { hash: "0xabc", height: 1 },
        timestamp: "1000000",
        sequence_number: "1",
        version: "1",
        changes: [change],
      } as unknown as AptosTransaction;

      const event = {
        guid: {
          account_address: "0x11",
          creation_number: "2",
        },
        type: "0x1::coin::WithdrawEvent",
      } as Event;

      const result = getResourceAddress(tx, event, "withdraw_events", getEventCoinAddress);
      expect(result).toEqual(APTOS_ASSET_ID);
    });

    it("should return null for not finding the valid coin in change", () => {
      const change = {
        type: "write_resource",
        data: {
          type: APTOS_COIN_CHANGE,
          data: {
            withdraw_events: {
              guid: {
                id: {
                  addr: "0x12",
                  creation_num: "2",
                },
              },
            },
          },
        },
      } as unknown as WriteSetChange;

      const tx: AptosTransaction = {
        hash: "0x123",
        block: { hash: "0xabc", height: 1 },
        timestamp: "1000000",
        sequence_number: "1",
        version: "1",
        changes: [change],
      } as unknown as AptosTransaction;

      const event = {
        guid: {
          account_address: "0x11",
          creation_number: "1",
        },
        type: "0x1::coin::WithdrawEvent",
      } as Event;

      const result = getResourceAddress(tx, event, "withdraw_events", getEventCoinAddress);
      expect(result).toBe(null);
    });

    it("should return null for not finding the event name in change", () => {
      const change = {
        type: "write_resource",
        data: {
          type: APTOS_COIN_CHANGE,
          data: {
            other_events: {
              guid: {
                id: {
                  addr: "0x12",
                  creation_num: "2",
                },
              },
            },
          },
        },
      } as unknown as WriteSetChange;

      const tx: AptosTransaction = {
        hash: "0x123",
        block: { hash: "0xabc", height: 1 },
        timestamp: "1000000",
        sequence_number: "1",
        version: "1",
        changes: [change],
      } as unknown as AptosTransaction;

      const event = {
        guid: {
          account_address: "0x11",
          creation_number: "1",
        },
        type: "0x1::coin::WithdrawEvent",
      } as Event;

      const result = getResourceAddress(tx, event, "withdraw_events", getEventCoinAddress);
      expect(result).toBe(null);
    });

    it("should return fungible asset address", () => {
      const change = {
        type: "write_resource",
        address: "0xsomeaddress",
        data: {
          type: APTOS_FUNGIBLE_STORE,
          data: {
            metadata: {
              inner: "0xassetaddress",
            },
          },
        },
      } as unknown as WriteSetChange;

      const tx: AptosTransaction = {
        hash: "0x123",
        block: { hash: "0xabc", height: 1 },
        timestamp: "1000000",
        sequence_number: "1",
        version: "1",
        changes: [change],
      } as unknown as AptosTransaction;

      const event = {
        guid: {
          account_address: "0x0",
          creation_number: "0",
        },
        type: "0x1::fungible_asset::Deposit",
        data: {
          amount: "100",
          store: "0xsomeaddress",
        },
      } as Event;

      const result = getResourceAddress(tx, event, "withdraw_events", getEventFAAddress);
      expect(result).toEqual("0xassetaddress");
    });

    it("should return null address instead of fungible asset when wrong type", () => {
      const change = {
        type: "write_resource",
        address: "0xsomeaddress",
        data: {
          type: APTOS_COIN_CHANGE,
          data: {
            metadata: {
              inner: "0xassetaddress",
            },
          },
        },
      } as unknown as WriteSetChange;

      const tx: AptosTransaction = {
        hash: "0x123",
        block: { hash: "0xabc", height: 1 },
        timestamp: "1000000",
        sequence_number: "1",
        version: "1",
        changes: [change],
      } as unknown as AptosTransaction;

      const event = {
        guid: {
          account_address: "0x0",
          creation_number: "0",
        },
        type: "0x1::fungible_asset::Deposit",
        data: {
          amount: "100",
          store: "0xsomeaddress",
        },
      } as Event;

      const result = getResourceAddress(tx, event, "withdraw_events", getEventFAAddress);
      expect(result).toEqual(null);
    });

    it("should return null address instead of fungible asset when wrong event address", () => {
      const change = {
        type: "write_resource",
        address: "0xsomeaddress",
        data: {
          type: APTOS_FUNGIBLE_STORE,
          data: {
            metadata: {
              inner: "0xassetaddress",
            },
          },
        },
      } as unknown as WriteSetChange;

      const tx: AptosTransaction = {
        hash: "0x123",
        block: { hash: "0xabc", height: 1 },
        timestamp: "1000000",
        sequence_number: "1",
        version: "1",
        changes: [change],
      } as unknown as AptosTransaction;

      const event = {
        guid: {
          account_address: "0x0",
          creation_number: "0",
        },
        type: "0x1::fungible_asset::Deposit",
        data: {
          amount: "100",
          store: "0xwrongaddress",
        },
      } as Event;

      const result = getResourceAddress(tx, event, "withdraw_events", getEventFAAddress);
      expect(result).toEqual(null);
    });
  });

  describe("getCoinAndAmounts", () => {
    it("should calculate the correct legacy coins amounts for withdraw and deposit events", () => {
      const tx = {
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
              account_address: "0x11",
              creation_number: "2",
            },
            data: {
              amount: "50",
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
                      addr: "0x11",
                      creation_num: "2",
                    },
                  },
                },
              },
            },
          },
        ],
      } as unknown as AptosTransaction;

      const address = "0x11";
      const result = getCoinAndAmounts(tx, address);

      expect(result.amount_in).toEqual(new BigNumber(50));
      expect(result.amount_out).toEqual(new BigNumber(100));
      expect(result.coin_id).toEqual(APTOS_ASSET_ID);
    });

    it("should calculate the correct fungible asset amounts for withdraw and deposit events", () => {
      const tx = {
        events: [
          {
            type: "0x1::fungible_asset::Withdraw",
            guid: {
              account_address: "0x11",
              creation_number: "1",
            },
            data: {
              amount: "100",
              store: "0x22",
            },
          },
          {
            type: "0x1::fungible_asset::Deposit",
            guid: {
              account_address: "0x11",
              creation_number: "2",
            },
            data: {
              amount: "50",
              store: "0x33",
            },
          },
        ],
        changes: [
          {
            type: "write_resource",
            address: "0x22",
            data: {
              type: APTOS_FUNGIBLE_STORE,
              data: {
                metadata: {
                  inner: "0x44",
                },
                transfer_events: {
                  guid: {
                    id: {
                      addr: "0x11",
                      creation_num: "2",
                    },
                  },
                },
              },
            },
          },
          {
            type: "write_resource",
            address: "0x22",
            data: {
              type: APTOS_OBJECT_CORE,
              data: {
                owner: "0x11",
                transfer_events: {
                  guid: {
                    id: {
                      addr: "0x22",
                      creation_num: "2",
                    },
                  },
                },
              },
            },
          },
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
                      addr: "0x11",
                      creation_num: "2",
                    },
                  },
                },
              },
            },
          },
        ],
      } as unknown as AptosTransaction;

      const address = "0x11";
      const result = getCoinAndAmounts(tx, address);

      expect(result.amount_in).toEqual(new BigNumber(0));
      expect(result.amount_out).toEqual(new BigNumber(100));
      expect(result.coin_id).toEqual("0x44");
    });

    it("should return zero amounts if no matching events are found", () => {
      const tx = {
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
              account_address: "0x11",
              creation_number: "2",
            },
            data: {
              amount: "50",
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
                      addr: "0x12", // should fail by address check
                      creation_num: "1",
                    },
                  },
                },
                deposit_events: {
                  guid: {
                    id: {
                      addr: "0x11",
                      creation_num: "3", // should fail by number check
                    },
                  },
                },
              },
            },
          },
        ],
      } as unknown as AptosTransaction;

      const address = "0x11";
      const result = getCoinAndAmounts(tx, address);

      expect(result.amount_in).toEqual(new BigNumber(0));
      expect(result.amount_out).toEqual(new BigNumber(0));
      expect(result.coin_id).toEqual(null);
    });

    it("should handle transactions with other events", () => {
      const tx = {
        events: [
          {
            type: "0x1::coin::OtherEvent",
            guid: {
              account_address: "0x11",
              creation_number: "1",
            },
            data: {
              amount: "100",
            },
          },
        ],
      } as unknown as AptosTransaction;

      const address = "0x1";
      const result = getCoinAndAmounts(tx, address);

      expect(result.amount_in).toEqual(new BigNumber(0));
      expect(result.amount_out).toEqual(new BigNumber(0));
      expect(result.coin_id).toEqual(null);
    });
  });

  describe("calculateAmount", () => {
    it("should calculate the correct amount when the address is the sender", () => {
      const address = "0x11";
      const sender = "0x11";
      const fee = new BigNumber(10); // account pays fees
      const amount_in = new BigNumber(50);
      const amount_out = new BigNumber(100);

      const result = calculateAmount(sender, address, fee, amount_in, amount_out);

      // LL negates the amount for SEND transactions during output
      expect(result).toEqual(new BigNumber(60)); // -(50 - 100 - 10)
    });

    it("should calculate the correct amount when the address is not the sender", () => {
      const address = "0x11";
      const sender = "0x12";
      const fee = new BigNumber(10); // sender pays fees
      const amount_in = new BigNumber(100);
      const amount_out = new BigNumber(50);

      const result = calculateAmount(sender, address, fee, amount_in, amount_out);

      expect(result).toEqual(new BigNumber(50)); // 100 - 50
    });

    it("should handle transactions with zero amounts", () => {
      const address = "0x11";
      const sender = "0x11";
      const fee = new BigNumber(10);
      const amount_in = new BigNumber(0);
      const amount_out = new BigNumber(0);

      const result = calculateAmount(sender, address, fee, amount_in, amount_out);

      // LL negates the amount for SEND transactions during output
      expect(result).toEqual(new BigNumber(10)); // -(0 - 0 - 10)
    });

    it("should get negative numbers (for send tx with deposit to account)", () => {
      const address = "0x11";
      const sender = "0x11";
      const fee = new BigNumber(10);
      const amount_in = new BigNumber(100);
      const amount_out = new BigNumber(0);

      const result = calculateAmount(sender, address, fee, amount_in, amount_out);

      // LL negates the amount for SEND transactions during output
      expect(result).toEqual(new BigNumber(90).negated()); // 100 - 10
    });
  });

  describe("txsToOps", () => {
    it("should convert Aptos transactions to operations correctly", () => {
      const address = "0x11";
      const id = "test-id";
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

      const [result, _] = txsToOps({ address }, id, txs);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: expect.any(String),
        hash: "0x123",
        type: DIRECTION.OUT,
        value: new BigNumber(20100),
        fee: new BigNumber(20000),
        blockHash: "0xabc",
        blockHeight: 1,
        senders: ["0x11"],
        recipients: ["0x12"],
        accountId: id,
        date: new Date(1000),
        extra: { version: undefined },
        transactionSequenceNumber: 1,
        hasFailed: false,
      });
    });

    it("should skip transactions without functions in payload", () => {
      const address = "0x11";
      const id = "test-id";
      const txs: AptosTransaction[] = [
        {
          hash: "0x123",
          sender: "0x11",
          gas_used: "200",
          gas_unit_price: "100",
          success: true,
          payload: {} as EntryFunctionPayloadResponse,
          // payload: {
          //   type: "entry_function_payload",
          //   function: "0x1::coin::transfer",
          //   type_arguments: [],
          //   arguments: ["0x12", 100],
          // } as EntryFunctionPayloadResponse,
          events: [],
          changes: [],
          block: { hash: "0xabc", height: 1 },
          timestamp: "1000000",
          sequence_number: "1",
        } as unknown as AptosTransaction,
      ];

      const [result, _] = txsToOps({ address }, id, txs);

      expect(result).toHaveLength(0);
    });

    it("should skip transactions that result in no Aptos change", () => {
      const address = "0x11";
      const id = "test-id";
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

      const [result, _] = txsToOps({ address }, id, txs);

      expect(result).toHaveLength(0);
    });

    it("should handle failed transactions", () => {
      const address = "0x11";
      const id = "test-id";
      const txs: AptosTransaction[] = [
        {
          hash: "0x123",
          sender: "0x11",
          gas_used: "200",
          gas_unit_price: "100",
          success: false,
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

      const [result, _token_result] = txsToOps({ address }, id, txs);

      expect(result).toHaveLength(1);
      expect(result[0].hasFailed).toBe(true);
    });
  });
});
