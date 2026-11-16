import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import { toNetworkValidator } from "@features/platform-account-source-coin-module";
import solanaCoinModuleStakes from "./coinModuleStakes";

const stake = (overrides: Partial<Stake>): Stake => ({
  uid: "stakeAccount",
  address: "main",
  delegate: "vote",
  state: "inactive",
  asset: { type: "native" },
  amount: 0n,
  amountDeposited: 0n,
  amountRewarded: 0n,
  actions: ["withdraw", "delegate"],
  details: { withdrawableAmount: 2_500_000 },
  ...overrides,
});

const normalize = (value: Stake) => solanaCoinModuleStakes.normalizeStake?.(value);

describe("solanaCoinModuleStakes", () => {
  it("answers an undelegated stake account as withdrawable, holding what it can withdraw", () => {
    const normalized = normalize(stake({}));
    expect(normalized).toMatchObject({ state: "withdrawable", amount: 2_500_000n });
    expect(normalized).not.toHaveProperty("amountDeposited");
  });

  it("leaves a delegated stake, and an inactive one with nothing to withdraw", () => {
    const active = stake({ state: "active", amount: 10n, amountDeposited: 10n });
    expect(normalize(active)).toBe(active);
    const locked = stake({ details: { withdrawableAmount: 0 } });
    expect(normalize(locked)).toBe(locked);
  });

  it("lists a validator with its percentage commission as a fraction", () => {
    const getValidatorsItem = {
      id: "vote",
      address: "vote",
      name: "Ledger by Figment",
      balance: 1_000n,
      commissionRate: "7",
    };
    const validator = solanaCoinModuleStakes.normalizeValidator?.(getValidatorsItem);
    expect(validator && toNetworkValidator(validator)).toMatchObject({ commission: 0.07 });
  });
});
