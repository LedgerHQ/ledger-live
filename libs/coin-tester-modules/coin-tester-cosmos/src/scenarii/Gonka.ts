import { killInferenced, spawnInferenced } from "../inferenced";
import { gonka } from "../helpers";
import { makeCosmosScenario } from "./shared";

// Gonka's validator set comes from Proof-of-Compute, overriding x/staking: the
// chain rejects delegation messages, so this scenario is send-only. Fees are
// zero (FeeParams.MinGasPriceNgonka = 0 / minimum-gas-prices = "0ngonka" at the
// node level), which is what minGasPrice: 0 exercises.
export const GonkaScenario = makeCosmosScenario({
  name: "Gonka Ledger Live transactions",
  currency: gonka,
  hrp: "gonka",
  minGasPrice: 0,
  staking: false,
  spawn: spawnInferenced,
  kill: killInferenced,
  retryInterval: 1000,
  retryLimit: 30,
});
