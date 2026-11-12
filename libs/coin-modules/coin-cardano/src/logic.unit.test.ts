import BigNumber from "bignumber.js";
import { CardanoInvalidProtoParams } from "./errors";
import { getProtocolParamsFixture } from "./fixtures/protocolParams";
import {
  calculateMinAdaForTokens,
  canStake,
  computeAdaBalance,
  isAlreadyStaking,
  isValidNumString,
  readExplorerAmount,
  toTyphonProtocolParams,
} from "./logic";
import { CardanoAccount } from "./types";

describe("canStake", () => {
  it("should return false when acc has no funds", () => {
    const accWithNoFunds = {
      balance: new BigNumber(0),
    } as CardanoAccount;
    expect(canStake(accWithNoFunds)).toEqual(false);
  });

  it("should return true when acc has funds", () => {
    const accWithFunds = {
      balance: new BigNumber(1),
    } as CardanoAccount;
    expect(canStake(accWithFunds)).toEqual(true);
  });
});

describe("isAlreadyStaking", () => {
  it("should return false when acc isn't delegating", () => {
    const noResourcesAcc = {} as CardanoAccount;
    expect(isAlreadyStaking(noResourcesAcc)).toEqual(false);
    const noDelegationAcc = {
      cardanoResources: {},
    } as CardanoAccount;
    expect(isAlreadyStaking(noDelegationAcc)).toEqual(false);
    const noPoolIdAcc = { cardanoResources: { delegation: {} } } as CardanoAccount;
    expect(isAlreadyStaking(noPoolIdAcc)).toEqual(false);
  });

  it("should return true when acc is delegating", () => {
    const noResourcesAcc = {
      cardanoResources: { delegation: { poolId: "itspoolid" } },
    } as CardanoAccount;
    expect(isAlreadyStaking(noResourcesAcc)).toEqual(true);
  });
});

describe("isValidNumString", () => {
  it("should return false for invalid number", () => {
    expect(isValidNumString("")).toEqual(false);
    expect(isValidNumString(" ")).toEqual(false);
    expect(isValidNumString("abc")).toEqual(false);
    expect(isValidNumString(undefined)).toEqual(false);
    expect(isValidNumString(null)).toEqual(false);
    expect(isValidNumString({})).toEqual(false);
    expect(isValidNumString([])).toEqual(false);
  });

  it("should return true for valid number", () => {
    expect(isValidNumString(123)).toEqual(true);
    expect(isValidNumString(123.321)).toEqual(true);
    expect(isValidNumString("123")).toEqual(true);
    expect(isValidNumString("123.321")).toEqual(true);
  });
});

describe("toTyphonProtocolParams", () => {
  it("converts valid protocol params", () => {
    expect(toTyphonProtocolParams(getProtocolParamsFixture()).stakeKeyDeposit).toEqual(
      new BigNumber(2000000),
    );
  });

  it.each(["stakeKeyDeposit", "minFeeRefScriptCostPerByte"] as const)(
    "throws CardanoInvalidProtoParams on an unreadable %s",
    field => {
      expect(() =>
        toTyphonProtocolParams({ ...getProtocolParamsFixture(), [field]: "abc" }),
      ).toThrow(CardanoInvalidProtoParams);
    },
  );

  it.each([
    ["utxoCostPerByte", "-1"],
    ["utxoCostPerByte", "1.5"],
    ["utxoCostPerByte", "1e1000000"],
    ["stakeKeyDeposit", "-1"],
    ["stakeKeyDeposit", "1.5"],
  ] as const)("throws CardanoInvalidProtoParams on a %s of %p", (field, value) => {
    expect(() => toTyphonProtocolParams({ ...getProtocolParamsFixture(), [field]: value })).toThrow(
      CardanoInvalidProtoParams,
    );
  });

  it("throws CardanoInvalidProtoParams when the network omits the protocol params", () => {
    expect(() => toTyphonProtocolParams(undefined)).toThrow(CardanoInvalidProtoParams);
  });
});

describe("computeAdaBalance", () => {
  const bn = (n: number | string) => new BigNumber(n);

  it("totals UTXO ADA plus rewards; spends everything when nothing is locked", () => {
    const { total, spendable } = computeAdaBalance({
      utxosSum: bn(5_000_000),
      minAdaForTokens: bn(0),
      rewards: bn(0),
    });
    expect(total.toFixed()).toBe("5000000");
    expect(spendable.toFixed()).toBe("5000000");
  });

  it("locks the min-ADA backing held tokens", () => {
    const { total, spendable } = computeAdaBalance({
      utxosSum: bn(5_000_000),
      minAdaForTokens: bn(1_500_000),
      rewards: bn(0),
    });
    expect(total.toFixed()).toBe("5000000");
    expect(spendable.toFixed()).toBe("3500000"); // locked = 1,500,000
  });

  it("counts rewards in the total but never as spendable", () => {
    const { total, spendable } = computeAdaBalance({
      utxosSum: bn(5_000_000),
      minAdaForTokens: bn(0),
      rewards: bn(1_500_000),
    });
    expect(total.toFixed()).toBe("6500000");
    expect(spendable.toFixed()).toBe("5000000");
  });

  it("never reports negative spendable when min-ADA exceeds the UTXO ADA", () => {
    const { total, spendable } = computeAdaBalance({
      utxosSum: bn(1_000_000),
      minAdaForTokens: bn(1_500_000),
      rewards: bn(800_000),
    });
    expect(total.toFixed()).toBe("1800000");
    expect(spendable.toFixed()).toBe("0");
  });
});

describe("calculateMinAdaForTokens", () => {
  it.each(["abc", "", undefined, "1e1000000"])(
    "throws CardanoInvalidProtoParams on a %p utxoCostPerByte",
    utxoCostPerByte => {
      const tokens = [{ policyId: "a".repeat(56), assetName: "", amount: new BigNumber(1) }];

      expect(() => calculateMinAdaForTokens("addr_test1qz", tokens, utxoCostPerByte)).toThrow(
        CardanoInvalidProtoParams,
      );
    },
  );
});

describe("readExplorerAmount", () => {
  it("reads a lovelace amount", () => {
    expect(readExplorerAmount("fee", "170000").toFixed()).toBe("170000");
  });

  it.each(["abc", "", "-1", "1.5", "1e1000000", undefined])("rejects a %p fee", fees => {
    expect(() => readExplorerAmount("fee", fees)).toThrow(
      "Cardano: unreadable fee amount from the explorer",
    );
  });
});
