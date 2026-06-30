import { killBabylond, spawnBabylond } from "../babylond";
import { babylon } from "../helpers";
import { makeCosmosScenario } from "./shared";

// Babylon staking is x/epoching-wrapped: a delegate is queued and only applies
// at the next epoch boundary (~10 blocks × 1s), so the retry budget is generous
// (1s × 60 = 60s) to absorb epoch drift on a contended runner. undelegate /
// redelegate are crafted correctly but no-op at the epoch boundary on this
// devnet (see README), so only send/delegate/claim are exercised.
export const BabylonScenario = makeCosmosScenario({
  name: "Babylon Ledger Live transactions",
  currency: babylon,
  hrp: "bbn",
  delegateLabel: "Delegate 100 BABY (wrapped via x/epoching)",
  spawn: spawnBabylond,
  kill: killBabylond,
  retryInterval: 1000,
  retryLimit: 60,
});
