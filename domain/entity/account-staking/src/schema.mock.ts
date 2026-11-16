import type { z } from "zod";
import {
  AccountStakingPositionSchema,
  AccountStakingSchema,
  type AccountStaking,
  type AccountStakingPosition,
} from "./schema";

/** An active cosmos delegation with unclaimed rewards unless overridden. */
export function mockAccountStakingPosition(
  overrides: Partial<z.input<typeof AccountStakingPositionSchema>> = {},
): AccountStakingPosition {
  return AccountStakingPositionSchema.parse({
    id: "cosmos1delegator:cosmosvaloper1validator",
    assetId: "cosmos",
    validatorId: "cosmosvaloper1validator",
    state: "active",
    amount: "1000000",
    rewards: "1500",
    actions: ["undelegate", "redelegate", "claim_reward"],
    ...overrides,
  });
}

/** One active delegation and one unbonding unless overridden. */
export function mockAccountStaking(
  overrides: Partial<z.input<typeof AccountStakingSchema>> = {},
): AccountStaking {
  return AccountStakingSchema.parse({
    positions: [
      mockAccountStakingPosition(),
      mockAccountStakingPosition({
        id: "cosmos1delegator:cosmosvaloper1validator:unbonding",
        state: "deactivating",
        amount: "250000",
        rewards: undefined,
        unlockAt: "2026-12-01T00:00:00.000Z",
        actions: [],
      }),
    ],
    ...overrides,
  });
}
