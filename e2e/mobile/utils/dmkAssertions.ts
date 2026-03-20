import { getLogs } from "../bridge/server";

type LogEntry = { type: string; message: string };

export async function assertDmkPaths(family?: string) {
  const rawLogs = await getLogs();
  const logs: LogEntry[] = JSON.parse(rawLogs as string);

  if (family === "solana") {
    const hasDmkSolSigner = logs.some(
      l => l.type === "dmk-path" && l.message.includes("using DmkSignerSol"),
    );
    const hasLegacySolSigner = logs.some(
      l => l.type === "dmk-path" && l.message.includes("using LegacySignerSolana"),
    );

    jestExpect(hasDmkSolSigner).toBe(true);
    jestExpect(hasLegacySolSigner).toBe(false);
  }
}
