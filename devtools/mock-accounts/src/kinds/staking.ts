import { AccountStakingSchema } from "@domain/entity-account-staking";
import { randomAmount } from "../random";
import type { MockReader } from "../families/types";

const STAKING_FAMILIES = new Set([
  "cosmos",
  "solana",
  "tezos",
  "near",
  "polkadot",
  "celo",
  "stacks",
]);

const DAY = 86_400_000;

/** A staking family's account stakes two times in three: one delegation with rewards, and one unbonding every other time. */
export const staking: MockReader<"staking"> = ({ currency, family, random }) => {
  if (!STAKING_FAMILIES.has(currency.family) || random() < 1 / 3) {
    return AccountStakingSchema.parse({ positions: [] });
  }
  const { magnitude } = currency.units[0];
  const validatorId = family.address(currency, random);
  const delegation = {
    id: `delegation:${validatorId}`,
    assetId: currency.id,
    validatorId,
    state: "active",
    amount: randomAmount(random, magnitude, 1, 50).toString(),
    rewards: randomAmount(random, magnitude, 0.001, 1).toString(),
    actions: ["undelegate", "redelegate", "claim_reward"],
  };
  // Midnight a few days ahead: the same answer all day long.
  const unlockDay = Math.floor(Date.now() / DAY) + 1 + Math.floor(random() * 21);
  const unbonding = {
    id: `unbonding:${validatorId}`,
    assetId: currency.id,
    validatorId,
    state: "deactivating",
    amount: randomAmount(random, magnitude, 0.1, 10).toString(),
    unlockAt: new Date(unlockDay * DAY).toISOString(),
    actions: [],
  };
  return AccountStakingSchema.parse({
    positions: random() < 0.5 ? [delegation, unbonding] : [delegation],
  });
};
