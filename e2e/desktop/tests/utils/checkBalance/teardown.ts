import { readFileSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { resolve } from "path";
import { buildSlackPayload } from "./slack";
import type { AccountResult, FundReport } from "./types";

export default async function globalTeardown() {
  const artifactsDir = resolve(__dirname, "../../artifacts");

  const partialFiles = readdirSync(artifactsDir).filter(
    f => f.startsWith("fund-monitor-partial-") && f.endsWith(".json"),
  );

  const allResults: AccountResult[] = partialFiles.flatMap(
    f => JSON.parse(readFileSync(resolve(artifactsDir, f), "utf-8")) as AccountResult[],
  );

  const report: FundReport = {
    date: new Date().toISOString(),
    hasAlerts: allResults.some(r => r.isLow),
    accounts: allResults,
  };

  writeFileSync(resolve(artifactsDir, "fund-monitor-report.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    resolve(artifactsDir, "fund-monitor-slack-payload.json"),
    JSON.stringify(buildSlackPayload(report), null, 2),
  );

  for (const f of partialFiles) {
    unlinkSync(resolve(artifactsDir, f));
  }
}
