import { NotEnoughBalance, NotEnoughBalanceFees } from "@ledgerhq/errors";
import { mapDryRunError } from "./mapDryRunError";

describe("mapDryRunError", () => {
  describe("NotEnoughBalanceFees pattern", () => {
    it("maps a real Sui gas-shortage message and attaches cause", () => {
      const error = new Error("Balance of gas object 10 is lower than the needed amount: 100");
      const result = mapDryRunError(error);
      expect(result).toBeInstanceOf(NotEnoughBalanceFees);
      expect(result.cause).toBe(error);
    });

    it("matches case-insensitively", () => {
      const error = new Error("Balance of gas object 10 is Lower than the Needed Amount: 100");
      expect(mapDryRunError(error)).toBeInstanceOf(NotEnoughBalanceFees);
    });
  });

  describe("InsufficientBalanceError pattern", () => {
    it("maps a real Sui insufficient-balance message and attaches cause", () => {
      const error = new Error(
        "Insufficient balance of 0x2::sui::SUI for owner 0xabc123. Required: 1000, Available: 500",
      );
      const result = mapDryRunError(error);
      expect(result).toBeInstanceOf(NotEnoughBalanceFees);
      expect(result.cause).toBe(error);
    });

    it("does not match a generic 'insufficient balance' string without the owner clause", () => {
      const error = new Error("Insufficient balance in your wallet");
      expect(mapDryRunError(error)).not.toBeInstanceOf(NotEnoughBalanceFees);
    });
  });

  describe("InsufficientCoinBalance pattern", () => {
    it("maps the tx.build() InsufficientCoinBalance message to NotEnoughBalance", () => {
      const error = new Error(
        "Transaction resolution failed: InsufficientCoinBalance in command 0",
      );
      const result = mapDryRunError(error);
      expect(result).toBeInstanceOf(NotEnoughBalance);
      expect(result.cause).toBe(error);
    });

    it("matches case-insensitively", () => {
      const error = new Error("insufficientcoinbalance in command 1");
      expect(mapDryRunError(error)).toBeInstanceOf(NotEnoughBalance);
    });
  });

  describe("error shape unwrapping", () => {
    it("handles plain Error instances", () => {
      const error = new Error("Balance of gas object 10 is lower than the needed amount: 100");
      expect(mapDryRunError(error)).toBeInstanceOf(NotEnoughBalanceFees);
    });

    it("handles error-like objects with a message property and wraps as cause", () => {
      const error = { message: "Balance of gas object 10 is lower than the needed amount: 100" };
      const result = mapDryRunError(error);
      expect(result).toBeInstanceOf(NotEnoughBalanceFees);
      expect(result.cause).toBeInstanceOf(Error);
    });

    it("handles nested SDK errors where message is on a wrapper", () => {
      const error = { message: "Insufficient balance of X for owner Y" };
      expect(mapDryRunError(error)).toBeInstanceOf(NotEnoughBalanceFees);
    });

    it("returns the original Error untouched when no pattern matches", () => {
      const error = new Error("some unrelated RPC failure");
      expect(mapDryRunError(error)).toBe(error);
    });

    it("wraps non-Error, non-object values in an Error", () => {
      const result = mapDryRunError("a string was thrown");
      expect(result).toBeInstanceOf(Error);
      expect(result).not.toBeInstanceOf(NotEnoughBalanceFees);
    });

    it("handles null and undefined without crashing", () => {
      expect(() => mapDryRunError(null)).not.toThrow();
      expect(() => mapDryRunError(undefined)).not.toThrow();
    });
  });
});
