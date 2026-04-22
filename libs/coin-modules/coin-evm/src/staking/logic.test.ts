import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { StakingAccount, StakingDelegation } from "../types";
import { canRedelegate, getMaxEstimatedBalance } from "./logic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAccount(
  currencyId: string,
  redelegations: StakingAccount["stakingResources"]["redelegations"] = [],
): StakingAccount {
  return {
    currency: { id: currencyId } as CryptoCurrency,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    stakingResources: {
      delegations: [],
      redelegations,
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    },
  } as unknown as StakingAccount;
}

function makeDelegation(validatorAddress: string): StakingDelegation {
  return {
    validatorAddress,
    amount: new BigNumber(0),
    pendingRewards: new BigNumber(0),
    status: "bonded",
  } as unknown as StakingDelegation;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("evm staking logic", () => {
  describe("canRedelegate", () => {
    const FUTURE = new Date(Date.now() + 86_400_000);

    it("returns false for a chain without a redelegate precompile function (celo)", () => {
      const account = makeAccount("celo");
      expect(canRedelegate(account, makeDelegation("0xvalidator"))).toBe(false);
    });

    it("returns false for an unknown currency id", () => {
      const account = makeAccount("unknown_chain");
      expect(canRedelegate(account, makeDelegation("0xvalidator"))).toBe(false);
    });

    it("returns true for sei_evm when no active redelegations exist", () => {
      const account = makeAccount("sei_evm");
      expect(canRedelegate(account, makeDelegation("0xvalidator"))).toBe(true);
    });

    it("returns false when the delegation is the destination of an active redelegation (cooldown)", () => {
      const account = makeAccount("sei_evm", [
        {
          validatorSrcAddress: "0xsrc",
          validatorDstAddress: "0xvalidator",
          completionDate: FUTURE,
          amount: new BigNumber(0),
        },
      ]);
      expect(canRedelegate(account, makeDelegation("0xvalidator"))).toBe(false);
    });

    it("returns false when the maxRedelegations cap is reached", () => {
      const activeRedelegations = Array.from({ length: 7 }, (_, i) => ({
        validatorSrcAddress: `0xsrc${i}`,
        validatorDstAddress: `0xdst${i}`,
        completionDate: FUTURE,
        amount: new BigNumber(0),
      }));
      const account = makeAccount("sei_evm", activeRedelegations);
      expect(canRedelegate(account, makeDelegation("0xother"))).toBe(false);
    });

    it("ignores expired redelegations when checking the cooldown", () => {
      const past = new Date(Date.now() - 86_400_000);
      const account = makeAccount("sei_evm", [
        {
          validatorSrcAddress: "0xsrc",
          validatorDstAddress: "0xvalidator",
          completionDate: past,
          amount: new BigNumber(0),
        },
      ]);
      expect(canRedelegate(account, makeDelegation("0xvalidator"))).toBe(true);
    });
  });

  describe("getMaxEstimatedBalance", () => {
    it("uses the spendable balance without subtracting staked resources again", () => {
      const account = {
        balance: new BigNumber("3062112500000000000"),
        spendableBalance: new BigNumber("3062112500000000000"),
        stakingResources: {
          delegations: [],
          redelegations: [],
          unbondings: [],
          delegatedBalance: new BigNumber("3000000000000000000"),
          pendingRewardsBalance: new BigNumber(0),
          unbondingBalance: new BigNumber(0),
        },
      } as unknown as StakingAccount;

      expect(getMaxEstimatedBalance(account, new BigNumber("100000000000000000"))).toEqual(
        new BigNumber("2962112500000000000"),
      );
    });

    it("returns zero when fees exceed spendable balance", () => {
      const account = {
        balance: new BigNumber("1000"),
        spendableBalance: new BigNumber("500"),
        stakingResources: {
          delegations: [],
          redelegations: [],
          unbondings: [],
          delegatedBalance: new BigNumber(0),
          pendingRewardsBalance: new BigNumber(0),
          unbondingBalance: new BigNumber(0),
        },
      } as unknown as StakingAccount;

      expect(getMaxEstimatedBalance(account, new BigNumber("600"))).toEqual(new BigNumber(0));
    });
  });
});
