import { Event, EntryFunctionPayloadResponse, WriteSetChange } from "@aptos-labs/ts-sdk";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { calculateAmount, getAptosAmounts, getFunctionAddress, isChangeOfAptos } from "./logic";
import { processRecipients, compareAddress } from "./logic";
import type { AptosTransaction } from "./types";

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

  ///////////////////////////////////////////
  describe("getFunctionAddress", () => {
    it("should return the function address when payload contains a function", () => {
      const payload: EntryFunctionPayloadResponse = {
        function: "0x1::coin::transfer",
        type_arguments: [],
        arguments: [],
      };

      const result = getFunctionAddress(payload);
      expect(result).toBe("0x1");
    });

    it("should return undefined when payload does not contain a function", () => {
      const payload = {
        function: "",
        type_arguments: [],
        arguments: [],
      } as EntryFunctionPayload;

      const result = getFunctionAddress(payload);
      expect(result).toBeUndefined();
    });

    it("should return undefined when payload is empty", () => {
      const payload = {} as EntryFunctionPayloadResponse;

      const result = getFunctionAddress(payload);
      expect(result).toBeUndefined();
    });
  });
  ///////////////////////////////////////////
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
      const payload: EntryFunctionPayloadResponse = {
        function: "0x1::coin::transfer",
        type_arguments: [],
        arguments: ["0x12", "0x13", 1], //from: &signer, to: address, amount: u64
      };

      processRecipients(payload, "0x13", op, "0x1");
      expect(op.recipients).toContain("0x13");
    });

    it("should add recipient for transfer-like functions from external account", () => {
      const payload: EntryFunctionPayloadResponse = {
        function: "0x1::coin::transfer",
        type_arguments: [],
        arguments: ["0x13", "0x12", 1], //from: &signer, to: address, amount: u64
      };

      processRecipients(payload, "0x13", op, "0x1");
      expect(op.recipients).toContain("0x12");
    });

    it("should add recipients for batch transfer functions", () => {
      const payload: EntryFunctionPayloadResponse = {
        function: "0x1::aptos_account::batch_transfer_coins",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: ["0x11", ["0x12", "0x13"], [1, 2]],
      };

      op.senders.push("0x11");
      processRecipients(payload, "0x12", op, "0x1");
      expect(op.recipients).toContain("0x12");
    });

    it("should add function address as recipient for other smart contracts", () => {
      const payload: PayloadResponse = {
        function: "0x2::other::contract",
        type_arguments: [],
        arguments: ["0x11", ["0x12"], [1]],
      };

      processRecipients(payload, "0x11", op, "0x2");
      expect(op.recipients).toContain("0x2");
    });
  });
  ///////////////////////////////////////////
  describe("isChangeOfAptos", () => {
    it("should return true for a valid change of Aptos", () => {
      const change = {
        type: "write_resource",
        data: {
          type: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
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

      const event = {
        guid: {
          account_address: "0x11",
          creation_number: "2",
        },
        type: "0x1::coin::WithdrawEvent",
      } as Event;

      const result = isChangeOfAptos(change, event, "withdraw_events");
      expect(result).toBe(true);
    });

    it("should return false for an invalid change of Aptos", () => {
      const change = {
        type: "write_resource",
        data: {
          type: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
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

      const event = {
        guid: {
          account_address: "0x11",
          creation_number: "1",
        },
        type: "0x1::coin::WithdrawEvent",
      } as Event;

      const result = isChangeOfAptos(change, event, "withdraw_events");
      expect(result).toBe(false);
    });

    it("should return false for a change with a different WriteSet type", () => {
      const change = {
        type: "write_module",
        data: {},
      } as unknown as WriteSetChange;

      const event = {
        guid: {
          account_address: "0x1",
          creation_number: "1",
        },
        type: "0x1::coin::WithdrawEvent",
      } as Event;

      const result = isChangeOfAptos(change, event, "withdraw_events");
      expect(result).toBe(false);
    });

    it("should return false for a change with a different WriteSet Change type", () => {
      const change = {
        type: "write_resource",
        data: {
          type: "0x1::coin::CoinStore<0x1::aptos_coin::ANY_OTHER_COIN>",
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

      const event = {
        guid: {
          account_address: "0x11",
          creation_number: "2",
        },
        type: "0x1::coin::WithdrawEvent",
      } as Event;

      const result = isChangeOfAptos(change, event, "withdraw_events");
      expect(result).toBe(false);
    });
  });
  ///////////////////////////////////////////
  describe("getAptosAmounts", () => {
    it("should calculate the correct amounts for withdraw and deposit events", () => {
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
              type: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
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
      const result = getAptosAmounts(tx, address);

      expect(result.amount_in).toEqual(new BigNumber(50));
      expect(result.amount_out).toEqual(new BigNumber(100));
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
              type: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
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
      const result = getAptosAmounts(tx, address);

      expect(result.amount_in).toEqual(new BigNumber(0));
      expect(result.amount_out).toEqual(new BigNumber(0));
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
      const result = getAptosAmounts(tx, address);

      expect(result.amount_in).toEqual(new BigNumber(0));
      expect(result.amount_out).toEqual(new BigNumber(0));
    });
  });
  ///////////////////////////////////////////
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
});
