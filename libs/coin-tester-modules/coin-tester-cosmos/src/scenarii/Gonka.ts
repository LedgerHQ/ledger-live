import { killInferenced, spawnInferenced } from "../inferenced";
import { gonka } from "../helpers";
import { makeCosmosScenario } from "./shared";

// Gonka's validator set comes from Proof-of-Compute, overriding x/staking: the
// chain rejects delegation messages, so this scenario is send-only. A Cosmos
// message pays 1 ngonka per gas (the `cosmos` fee group of the chain's FeeParams,
// as on mainnet): with minGasPrice: 0 the node refuses the transaction
// ("insufficient fee: got 0ngonka").
export const GonkaScenario = makeCosmosScenario({
  name: "Gonka Ledger Live transactions",
  currency: gonka,
  hrp: "gonka",
  minGasPrice: 1,
  staking: false,
  spawn: spawnInferenced,
  kill: killInferenced,
  retryInterval: 1000,
  retryLimit: 30,
});
