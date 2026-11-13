import { sandboxNode } from "./sandboxNode";

// Gonka on coin-sandbox
export const { spawn: spawnInferenced, kill: killInferenced } = sandboxNode("gonka");
