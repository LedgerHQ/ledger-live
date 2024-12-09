//import btc from "./platformAdapter";
//import { BitcoinTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
// import { FAMILIES } from "@ledgerhq/live-app-sdk";
// import BigNumber from "bignumber.js";

import BigNumber from "bignumber.js";
import { getFunctionAddress } from "./logic";

import { processRecipients, compareAddress } from "./logic";
import type { Operation, OperationType } from "@ledgerhq/types-live";

// jest.mock("./logic", () => ({
//   ...jest.requireActual("./logic"),
//   compareAddress: jest.fn(),
// }));

import type { Types as AptosTypes } from "aptos";
// import type { Operation, OperationType } from "@ledgerhq/types-live";
//import type { AptosTransaction, Transaction } from "./types";

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
      const payload: AptosTypes.EntryFunctionPayload = {
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
      } as AptosTypes.EntryFunctionPayload;

      const result = getFunctionAddress(payload);
      expect(result).toBeUndefined();
    });

    it("should return undefined when payload is empty", () => {
      const payload = {} as AptosTypes.EntryFunctionPayload;

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
      const payload: AptosTypes.EntryFunctionPayload = {
        function: "0x1::coin::transfer",
        type_arguments: [],
        arguments: ["0x12", "0x13", 1], //from: &signer, to: address, amount: u64
      };

      processRecipients(payload, "0x13", op, "0x1");
      expect(op.recipients).toContain("0x13");
    });

    it("should add recipient for transfer-like functions from external account", () => {
      const payload: AptosTypes.EntryFunctionPayload = {
        function: "0x1::coin::transfer",
        type_arguments: [],
        arguments: ["0x13", "0x12", 1], //from: &signer, to: address, amount: u64
      };

      processRecipients(payload, "0x13", op, "0x1");
      expect(op.recipients).toContain("0x12");
    });

    it("should add recipients for batch transfer functions", () => {
      const payload: AptosTypes.EntryFunctionPayload = {
        function: "0x1::aptos_account::batch_transfer_coins",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: ["0x11", ["0x12", "0x13"], [1, 2]],
      };

      op.senders.push("0x11");
      processRecipients(payload, "0x12", op, "0x1");
      expect(op.recipients).toContain("0x12");
    });

    it("should add function address as recipient for other smart contracts", () => {
      const payload: AptosTypes.EntryFunctionPayload = {
        function: "0x2::other::contract",
        type_arguments: [],
        arguments: ["0x11", ["0x12"], [1]],
      };

      processRecipients(payload, "0x11", op, "0x2");
      expect(op.recipients).toContain("0x2");
    });
  });
});
