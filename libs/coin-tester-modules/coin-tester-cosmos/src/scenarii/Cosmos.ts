import { killGaiad, spawnGaiad } from "../gaiad";
import { cosmos } from "../helpers";
import { makeCosmosScenario } from "./shared";

// Cosmos Hub staking is immediate (not x/epoching-wrapped): a MsgDelegate bonds
// at the next block, so a short retry budget (1s × 30) suffices. undelegate /
// redelegate would execute immediately here, so they could be added later;
// left out for now to keep this scenario in step with the Babylon one.
export const CosmosScenario = makeCosmosScenario({
  name: "Cosmos Hub Ledger Live transactions",
  currency: cosmos,
  hrp: "cosmos",
  delegateLabel: "Delegate 100 ATOM",
  spawn: spawnGaiad,
  kill: killGaiad,
  retryInterval: 1000,
  retryLimit: 30,
});
