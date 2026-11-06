import { sandboxNode } from "./sandboxNode";

// Gonka on coin-sandbox, at the version production runs
export const { spawn: spawnInferenced, kill: killInferenced } = sandboxNode("gonka", {
  implementation: "inference-chain",
  version: "0.2.16",
});
