import { sandboxNode } from "./sandboxNode";

// Babylon on coin-sandbox. The sandbox gives the chain an epoch of 10
// blocks, so that the wrapped delegate of the scenario lands in seconds
export const { spawn: spawnBabylond, kill: killBabylond } = sandboxNode("babylon");
