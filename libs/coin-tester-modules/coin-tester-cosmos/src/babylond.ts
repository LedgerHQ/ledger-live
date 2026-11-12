import { sandboxNode } from "./sandboxNode";

// Babylon on coin-sandbox, at the version production runs. The sandbox gives the chain an epoch of 10
// blocks, so that the wrapped delegate of the scenario lands in seconds
export const { spawn: spawnBabylond, kill: killBabylond } = sandboxNode("babylon", {
  implementation: "babylon",
  version: "4.6.0",
});
