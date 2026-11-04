import { sandboxNode } from "./sandboxNode";

// Cosmos Hub on coin-sandbox, at the version production runs
export const { spawn: spawnGaiad, kill: killGaiad } = sandboxNode("cosmos", {
  implementation: "gaia",
  version: "29.0.1",
});
