import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Operation,
  StakingAccount,
  StakingDelegation,
  StakingDelegationStatus,
} from "@ledgerhq/types-live";
import {
  canRedelegate,
  canUndelegate,
  getMaxEstimatedBalance,
  isSeiAccountUnassociated,
} from "./logic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAccount(
  currencyId: string,
  redelegations: StakingAccount["stakingResources"]["redelegations"] = [],
  {
    freshAddress = "0xMyAddress",
    operations = [] as Operation[],
  }: { freshAddress?: string; operations?: Operation[] } = {},
): StakingAccount {
  return {
    currency: { id: currencyId } as CryptoCurrency,
    freshAddress,
    operations,
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

function makeOperation(senders: string[], blockHeight: number | null = 123): Operation {
  return { senders, blockHeight } as unknown as Operation;
}

function makeDelegation(
  validatorAddress: string,
  status: StakingDelegationStatus,
): StakingDelegation {
  return {
    validatorAddress,
    amount: new BigNumber(0),
    pendingRewards: new BigNumber(0),
    status,
  } as unknown as StakingDelegation;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("evm staking logic", () => {
  describe("canRedelegate", () => {
    const FUTURE = new Date(Date.now() + 86_400_000);

    it("returns false for a chain without a redelegate precompile function (celo)", () => {
      const account = makeAccount("celo");
      expect(canRedelegate(account, makeDelegation("0xvalidator", "bonded"))).toBe(false);
    });

    it("returns false for an unknown currency id", () => {
      const account = makeAccount("unknown_chain");
      expect(canRedelegate(account, makeDelegation("0xvalidator", "bonded"))).toBe(false);
    });

    it("returns true for sei_evm when no active redelegations exist", () => {
      const account = makeAccount("sei_evm");
      expect(canRedelegate(account, makeDelegation("0xvalidator", "bonded"))).toBe(true);
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
      expect(canRedelegate(account, makeDelegation("0xvalidator", "bonded"))).toBe(false);
    });

    it("returns false when the maxRedelegations cap is reached", () => {
      const activeRedelegations = Array.from({ length: 7 }, (_, i) => ({
        validatorSrcAddress: `0xsrc${i}`,
        validatorDstAddress: `0xdst${i}`,
        completionDate: FUTURE,
        amount: new BigNumber(0),
      }));
      const account = makeAccount("sei_evm", activeRedelegations);
      expect(canRedelegate(account, makeDelegation("0xother", "bonded"))).toBe(false);
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
      expect(canRedelegate(account, makeDelegation("0xvalidator", "bonded"))).toBe(true);
    });
  });

  describe("canUndelegate", () => {
    it("returns true for a bonded delegation", () => {
      const account = makeAccount("monad");
      expect(canUndelegate(account, makeDelegation("0xvalidator", "bonded"))).toBe(true);
    });

    it("returns false for an activating delegation", () => {
      const account = makeAccount("monad");
      expect(canUndelegate(account, makeDelegation("0xvalidator", "activating"))).toBe(false);
    });

    it("returns true when no delegation is provided", () => {
      const account = makeAccount("monad");
      expect(canUndelegate(account)).toBe(true);
    });
  });

  describe("isSeiAccountUnassociated", () => {
    it("returns false for a non-sei_evm currency", () => {
      const account = makeAccount("ethereum");
      expect(isSeiAccountUnassociated(account.currency.id, account.freshAddress, account.operations)).toBe(false);
    });

    it("returns true for sei_evm with no operations", () => {
      const account = makeAccount("sei_evm");
      expect(isSeiAccountUnassociated(account.currency.id, account.freshAddress, account.operations)).toBe(true);
    });

    it("returns true for sei_evm when all operations are incoming (account never appeared as sender)", () => {
      const account = makeAccount("sei_evm", [], {
        operations: [makeOperation(["0xOtherAddress"]), makeOperation(["0xAnotherAddress"])],
      });
      expect(isSeiAccountUnassociated(account.currency.id, account.freshAddress, account.operations)).toBe(true);
    });

    it("returns false for sei_evm when the account appears as sender in at least one confirmed operation", () => {
      const account = makeAccount("sei_evm", [], {
        operations: [makeOperation(["0xOtherAddress"]), makeOperation(["0xMyAddress"])],
      });
      expect(isSeiAccountUnassociated(account.currency.id, account.freshAddress, account.operations)).toBe(false);
    });

    it("returns true for sei_evm when the account only appears as sender in an unconfirmed operation", () => {
      const account = makeAccount("sei_evm", [], {
        operations: [
          makeOperation(["0xMyAddress"], null),
          { senders: ["0xMyAddress"], blockHeight: undefined } as unknown as Operation,
        ],
      });
      expect(isSeiAccountUnassociated(account.currency.id, account.freshAddress, account.operations)).toBe(true);
    });
    it("returns false for sei_evm when the account is one of multiple senders in an operation", () => {
      const account = makeAccount("sei_evm", [], {
        operations: [makeOperation(["0xOtherAddress", "0xMyAddress"])],
      });
      expect(isSeiAccountUnassociated(account.currency.id, account.freshAddress, account.operations)).toBe(false);
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
