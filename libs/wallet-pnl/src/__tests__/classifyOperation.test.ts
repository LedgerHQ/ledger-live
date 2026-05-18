import type { OperationType } from "@ledgerhq/types-live";
import {
  OPERATION_TYPE_IN_FAMILY,
  OPERATION_TYPE_OUT_FAMILY,
  OPERATION_TYPE_STAKE_FAMILY,
} from "@ledgerhq/ledger-wallet-framework/operation";
import type { OperationFlow } from "../types";
import { INFLOWS, OUTFLOWS, STAKE_FAMILY, classifyOperation } from "../classifyOperation";
import { makeOp, OpOverrides } from "../scenarios/operations";

const opOfType = (
  type: OperationType | string,
  extras: OpOverrides = {},
): ReturnType<typeof makeOp> => makeOp({ type, ...extras });

describe("classifyOperation", () => {
  describe("taxonomy alignment with @ledgerhq/ledger-wallet-framework", () => {
    it.each(OPERATION_TYPE_IN_FAMILY)("INFLOWS includes IN_FAMILY '%s'", type => {
      expect(INFLOWS.has(type)).toBe(true);
    });

    it.each(OPERATION_TYPE_OUT_FAMILY)("OUTFLOWS includes OUT_FAMILY '%s'", type => {
      expect(OUTFLOWS.has(type)).toBe(true);
    });

    it.each(OPERATION_TYPE_STAKE_FAMILY)(
      "STAKE_FAMILY '%s' is excluded from INFLOWS and OUTFLOWS",
      type => {
        expect(INFLOWS.has(type)).toBe(false);
        expect(OUTFLOWS.has(type)).toBe(false);
      },
    );
  });

  describe("every INFLOWS member → 'inflow'", () => {
    it.each([...INFLOWS])("'%s'", type => {
      expect(classifyOperation(opOfType(type))).toBe("inflow");
    });
  });

  describe("every OUTFLOWS member → 'outflow'", () => {
    it.each([...OUTFLOWS])("'%s'", type => {
      expect(classifyOperation(opOfType(type))).toBe("outflow");
    });
  });

  describe("every STAKE_FAMILY member → 'ignored' (no principal transfer)", () => {
    it.each([...STAKE_FAMILY])("'%s'", type => {
      expect(classifyOperation(opOfType(type))).toBe("ignored");
    });
  });
  describe("classification anchors", () => {
    it.each<[string, OperationFlow]>([
      ["FEES", "outflow"],
      ["REWARD", "inflow"],
      ["REWARD_PAYOUT", "inflow"],
      ["BOND", "ignored"],
      ["STAKE", "ignored"],
      ["APPROVE", "ignored"],
      ["WITHDRAW", "inflow"],
      ["WITHDRAW_UNBONDED", "ignored"],
    ])("'%s' → '%s'", (type, expected) => {
      expect(classifyOperation(opOfType(type))).toBe(expected);
    });
  });

  describe("non-family no-op types → 'ignored'", () => {
    it.each(["NONE", "UNKNOWN"])("'%s'", type => {
      expect(classifyOperation(opOfType(type))).toBe("ignored");
    });
  });

  describe("open-set design: arbitrary strings resolve via INFLOWS / OUTFLOWS membership", () => {
    it.each<[string, OperationFlow]>([
      ["SUPPLY", "inflow"],
      ["REDEEM", "outflow"],
      ["SELL", "outflow"],
    ])("'%s' → '%s'", (type, expected) => {
      expect(classifyOperation(opOfType(type))).toBe(expected);
    });
  });

  describe("hasFailed=true short-circuits to 'ignored' regardless of type", () => {
    it.each(["IN", "OUT", "REWARD", "NFT_OUT", "SELL"])("failed '%s'", type => {
      expect(classifyOperation(opOfType(type, { hasFailed: true }))).toBe("ignored");
    });
  });

  describe("hasFailed: undefined and false are equivalent (strict boolean check)", () => {
    it("missing hasFailed property → IN classifies as 'inflow'", () => {
      const op = opOfType("IN");
      Reflect.deleteProperty(op, "hasFailed");
      expect(classifyOperation(op)).toBe("inflow");
    });

    it("hasFailed=false → IN classifies as 'inflow'", () => {
      expect(classifyOperation(opOfType("IN", { hasFailed: false }))).toBe("inflow");
    });
  });
});
