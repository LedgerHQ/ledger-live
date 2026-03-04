import { getLogs } from "../bridge/server";

export async function assertDmkPaths(family?: string) {
  const logsPayload = await getLogs();
  if (!logsPayload) {
    throw new Error("Expected non-empty logs payload from getLogs()");
  }
  let logs: Array<{ type: string; message: string }>;
  try {
    logs = JSON.parse(logsPayload as string);
  } catch (error) {
    throw new Error(
      `Unable to parse logs payload from getLogs(): ${(error as Error).message}. ` +
        `Raw payload: ${String(logsPayload)}`,
    );
  }

  const hasDmkConnectApp = logs.some(
    l => l.type === "dmk-path" && l.message?.includes("connectApp: using DMK"),
  );
  jestExpect(hasDmkConnectApp).toBe(true);

  const hasLegacyConnectApp = logs.some(
    l => l.type === "dmk-path" && l.message?.includes("connectApp: legacy path"),
  );
  jestExpect(hasLegacyConnectApp).toBe(false);

  if (family === "evm") {
    const hasDmkSigner = logs.some(
      l => l.type === "dmk-path" && l.message?.includes("using DmkSignerEth"),
    );
    jestExpect(hasDmkSigner).toBe(true);

    const hasLegacySigner = logs.some(
      l => l.type === "dmk-path" && l.message?.includes("using LegacySignerEth"),
    );
    jestExpect(hasLegacySigner).toBe(false);
  }
}
