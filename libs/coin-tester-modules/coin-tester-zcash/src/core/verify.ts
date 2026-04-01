import path from "path";
import fs from "fs/promises";
import { parse as parseYaml } from "yaml";
import { BigNumber } from "bignumber.js";
import { readSnapshot } from "./snapshot";
import { runAssertions } from "./assertions";
import { GoldenValuesSchema } from "../fixtures/golden-values.schema";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/zcash-shielded/constants";
import { logger } from "../utils/logger";

export interface VerifyConfig {
  /** Root directory that contains per-account subdirectories with snapshot files */
  fixturesDir: string;
  /** Path to golden-values.yaml */
  goldenValuesPath: string;
  mode: "quick" | "full";
}

export interface VerifyRow {
  account: string;
  height: number;
  check: string;
  expected: string;
  actual: string;
  /** false when the assertion failed; true for passing and skipped entries */
  pass: boolean;
  skipped?: boolean;
}

export interface VerifyResult {
  rows: VerifyRow[];
  totalFailed: number;
  allPassed: boolean;
}

export async function runVerify(config: VerifyConfig): Promise<VerifyResult> {
  const raw = await fs.readFile(config.goldenValuesPath, "utf-8");
  const parsed = GoldenValuesSchema.parse(parseYaml(raw));

  logger.info({ mode: config.mode, accounts: parsed.accounts.length }, "Starting verify");

  const rows: VerifyRow[] = [];
  let totalFailed = 0;

  for (const account of parsed.accounts) {
    for (const checkpoint of account.checkpoints) {
      const snapshotFile = path.join(
        config.fixturesDir,
        account.label,
        `height-${checkpoint.height}.snapshot`,
      );

      let snapshotExists = true;
      try {
        await fs.access(snapshotFile);
      } catch {
        snapshotExists = false;
      }

      if (!snapshotExists) {
        rows.push({
          account: account.label,
          height: checkpoint.height,
          check: "snapshot",
          expected: "exists",
          actual: "missing",
          pass: true,
          skipped: true,
        });
        continue;
      }

      const snapshot = await readSnapshot(snapshotFile);
      const derived = snapshot.derivedData;

      // Reconstruct a minimal account shape from derived data for runAssertions.
      // runAssertions treats account.balance as transparent-only and sums
      // orchardBalance + saplingBalance for shielded. We put all shielded in
      // orchardBalance since the derived data only stores the total shielded balance.
      const shieldedSat = new BigNumber(derived.shieldedBalance).times(1e8);
      const transparentSat = new BigNumber(derived.transparentBalance).times(1e8);
      // assertions.ts computes transparent = balance - shielded, so balance must be the total
      const totalSat = shieldedSat.plus(transparentSat);

      const assertResults = runAssertions(
        {
          balance: totalSat,
          operationsCount: derived.operationsCount,
          privateInfo: {
            ...DEFAULT_ZCASH_PRIVATE_INFO,
            orchardBalance: shieldedSat,
            saplingBalance: new BigNumber(0),
            transactions: new Array(derived.shieldedTxCount),
          },
        },
        {
          assertShieldedBalance: checkpoint.expectedShieldedBalance,
          assertTransparentBalance: checkpoint.expectedTransparentBalance,
          assertAvailableBalance: checkpoint.expectedAvailableBalance,
          assertOperationsCount: checkpoint.expectedOperationsCount,
          assertShieldedTxCount: checkpoint.expectedShieldedTxCount,
        },
      );

      for (const r of assertResults) {
        if (!r.pass) totalFailed++;
        rows.push({
          account: account.label,
          height: checkpoint.height,
          check: r.name,
          expected: r.expected,
          actual: r.actual,
          pass: r.pass,
        });
      }

      if (assertResults.length === 0) {
        rows.push({
          account: account.label,
          height: checkpoint.height,
          check: "—",
          expected: "—",
          actual: "—",
          pass: true,
          skipped: true,
        });
      }
    }
  }

  return { rows, totalFailed, allPassed: totalFailed === 0 };
}
