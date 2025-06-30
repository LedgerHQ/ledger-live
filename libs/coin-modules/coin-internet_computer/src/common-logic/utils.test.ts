import {
  isNoErrorReturnCode,
  getPath,
  isValidHex,
  isValidBase64,
  isError,
  methodToString,
  getBufferFromString,
  normalizeEpochTimestamp,
  getRandomTransferID,
  reassignOperationType,
  secondsToDurationString,
} from "./utils";
import { BigNumber } from "bignumber.js";
import { InternetComputerOperation } from "../types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

describe("Internet Computer utils", () => {
  describe("isNoErrorReturnCode", () => {
    it("should return true for 0x9000", () => {
      expect(isNoErrorReturnCode(0x9000)).toBe(true);
    });

    it("should return false for other codes", () => {
      expect(isNoErrorReturnCode(0x6985)).toBe(false);
      expect(isNoErrorReturnCode(0x6a80)).toBe(false);
    });
  });

  describe("getPath", () => {
    it("should prepend 'm/' if it does not exist", () => {
      expect(getPath("44'/223'/0'/0'/0'")).toBe("m/44'/223'/0'/0'/0'");
    });

    it("should return the same path if 'm/' exists", () => {
      expect(getPath("m/44'/223'/0'/0'/0'")).toBe("m/44'/223'/0'/0'/0'");
    });
  });

  describe("isValidHex", () => {
    it("should return true for valid hex strings", () => {
      expect(isValidHex("abcdef")).toBe(true);
      expect(isValidHex("AbCdEf")).toBe(true);
      expect(isValidHex("000000")).toBe(true);
      expect(isValidHex("123456")).toBe(true);
      expect(isValidHex("deadbeef")).toBe(true);
    });

    it("should return false for invalid hex strings", () => {
      expect(isValidHex("12345g")).toBe(false);
      expect(isValidHex("not hex")).toBe(false);
      expect(isValidHex("")).toBe(false);
    });
  });

  describe("isValidBase64", () => {
    it("should return true for valid base64 strings", () => {
      expect(isValidBase64("SGVsbG8gV29ybGQ=")).toBe(true); // "Hello World"
      expect(isValidBase64("Zm9vYmFy")).toBe(true); // "foobar"
      expect(isValidBase64("YQ==")).toBe(true); // "a"
    });

    it("should return false for invalid base64 strings", () => {
      expect(isValidBase64("not-base64")).toBe(false);
      expect(isValidBase64("SGVsbG8gV29ybGQ")).toBe(false); // missing padding
    });
  });

  describe("isError", () => {
    it("should not throw for success code", () => {
      expect(() => isError({ returnCode: 0x9000 })).not.toThrow();
    });

    it("should throw for error codes", () => {
      expect(() => isError({ returnCode: 0x6985, errorMessage: "Rejected" })).toThrow(
        "27013 - Rejected",
      );
    });
  });

  describe("methodToString", () => {
    it("should return correct string for each method", () => {
      expect(methodToString("create_neuron")).toBe("Stake Neuron");
      expect(methodToString("list_neurons")).toBe("List Own Neurons");
      expect(methodToString("disburse")).toBe("Disburse Neuron");
      expect(methodToString("stake_maturity")).toBe("Stake Maturity");
      expect(methodToString("start_dissolving")).toBe("Start Dissolving");
      expect(methodToString("stop_dissolving")).toBe("Stop Dissolving");
      expect(methodToString("spawn_neuron")).toBe("Spawn Neuron");
      expect(methodToString("refresh_voting_power")).toBe("Refresh Voting Power");
      expect(methodToString("auto_stake_maturity")).toBe("Set Auto Stake Maturity");
      expect(methodToString("increase_dissolve_delay")).toBe("Increase Dissolve Delay");
      expect(methodToString("set_dissolve_delay")).toBe("Set Dissolve Delay");
      expect(methodToString("split_neuron")).toBe("Split Neuron");
      expect(methodToString("remove_hot_key")).toBe("Remove HotKey");
      expect(methodToString("add_hot_key")).toBe("Add HotKey");
      expect(methodToString("follow")).toBe("Follow");
      // @ts-expect-error test for default case
      expect(methodToString("unknown_method")).toBe("Send ICP");
    });
  });

  describe("getBufferFromString", () => {
    it("should return buffer from hex string with even length", () => {
      const hexEven = "68656c6c6f30";
      expect(getBufferFromString(hexEven)).toEqual(Buffer.from(hexEven, "hex"));
    });

    it("should not treat odd-length hex string as hex and return buffer from string", () => {
      const hexOdd = "68656c6c6f";
      expect(getBufferFromString(hexOdd)).toEqual(Buffer.from(hexOdd, "hex"));
    });

    it("should return buffer from base64 string", () => {
      const b64 = "aGVsbG8="; // "hello"
      expect(getBufferFromString(b64)).toEqual(Buffer.from(b64, "base64"));
    });

    it("should return buffer from plain string", () => {
      const str = "hello_world"; // neither valid hex nor base64
      expect(getBufferFromString(str)).toEqual(Buffer.from(str));
    });
  });

  describe("normalizeEpochTimestamp", () => {
    it("should return a 13-digit timestamp", () => {
      const fullTimestamp = "1672531199123456"; // 2023-01-01T00:00:00.123456Z
      const normalized = normalizeEpochTimestamp(fullTimestamp);
      expect(normalized).toBe(1672531199123);
      expect(normalized.toString().length).toBe(13);
    });
  });

  describe("getRandomTransferID", () => {
    it("should return a random string number within range", () => {
      const id = getRandomTransferID();
      const idBigNum = new BigNumber(id);
      expect(idBigNum.isInteger()).toBe(true);
      expect(idBigNum.isGreaterThanOrEqualTo(0)).toBe(true);
      expect(idBigNum.isLessThanOrEqualTo("18446744073709551615")).toBe(true); // MAX_MEMO_VALUE
    });
  });

  describe("reassignOperationType", () => {
    const mockOp: InternetComputerOperation = {
      id: "some-id",
      hash: "some-hash",
      type: "IN",
      value: new BigNumber(100),
      fee: new BigNumber(10),
      senders: ["sender-addr"],
      recipients: ["neuron-addr-1"],
      blockHeight: 123,
      blockHash: "block-hash",
      accountId: "my-account-id",
      date: new Date(),
      extra: {
        memo: "12345",
      },
    };

    const neuronAddresses: string[] = ["neuron-addr-1", "neuron-addr-2"];

    it("should reassign type to STAKE_NEURON for neuron recipient with non-zero memo", () => {
      const operations = [{ ...mockOp }];
      const result = reassignOperationType(operations, neuronAddresses);
      const expectedId = encodeOperationId(mockOp.accountId, mockOp.hash, "STAKE_NEURON");
      expect(result[0].type).toBe("STAKE_NEURON");
      expect(result[0].id).toBe(expectedId);
    });

    it("should reassign type to TOP_UP_NEURON for neuron recipient with zero memo", () => {
      const operations = [{ ...mockOp, extra: { memo: "0" } }];
      const result = reassignOperationType(operations, neuronAddresses);
      const expectedId = encodeOperationId(mockOp.accountId, mockOp.hash, "TOP_UP_NEURON");
      expect(result[0].type).toBe("TOP_UP_NEURON");
      expect(result[0].id).toBe(expectedId);
    });

    it("should reassign type to TOP_UP_NEURON for neuron recipient with null memo", () => {
      const operations = [{ ...mockOp, extra: { memo: undefined } }];
      const result = reassignOperationType(operations, neuronAddresses);
      const expectedId = encodeOperationId(mockOp.accountId, mockOp.hash, "TOP_UP_NEURON");
      expect(result[0].type).toBe("TOP_UP_NEURON");
      expect(result[0].id).toBe(expectedId);
    });

    it("should not reassign type for non-neuron recipient", () => {
      const operations = [{ ...mockOp, recipients: ["some-other-addr"] }];
      const result = reassignOperationType(operations, neuronAddresses);
      expect(result[0].type).toBe("IN");
      expect(result[0].id).toBe("some-id");
    });
  });

  describe("secondsToDurationString", () => {
    it("should convert seconds to a duration string", () => {
      // 1 day, 1 hour, 1 minute, 1 second
      const seconds = "90061";
      const expected = "1 day, 1 hour";
      expect(secondsToDurationString(seconds)).toBe(expected);
    });
  });
});
