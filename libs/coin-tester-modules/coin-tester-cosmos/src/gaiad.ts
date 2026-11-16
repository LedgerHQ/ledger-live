import { sandboxNode } from "./sandboxNode";

// Cosmos Hub on coin-sandbox
export const { spawn: spawnGaiad, kill: killGaiad } = sandboxNode("cosmos");
