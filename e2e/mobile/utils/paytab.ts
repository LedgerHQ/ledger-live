import { readdirSync } from "node:fs";
import path from "node:path";
import type { Config } from "@jest/types";

export const PAYTAB_SPECS_DIR = "paytab";

/* tests if current process is running a Pay tab spec */
export function isPaytabSpec(): boolean {
  let specPath = "";
  if (typeof expect !== "undefined") {
    specPath = expect.getState().testPath ?? "";
  }
  return specPath.replaceAll("\\", "/").toLowerCase().includes(`/${PAYTAB_SPECS_DIR}/`);
}

/* tests if the current test run includes any Pay tab specs based on testPathPatterns */
export function runIncludesPaytabSpec(
  globalConfig: Config.GlobalConfig,
  projectConfig: Config.ProjectConfig,
): boolean {
  const { rootDir } = projectConfig;
  const paytabSpecs = specFilesUnder(path.join(rootDir, "specs", PAYTAB_SPECS_DIR));
  if (paytabSpecs.length === 0) return false;
  if (!globalConfig.testPathPatterns.isSet()) return true;
  const selected = globalConfig.testPathPatterns.toExecutor({ rootDir });
  return paytabSpecs.some(spec => selected.isMatch(spec));
}

function specFilesUnder(directory: string): string[] {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return specFilesUnder(fullPath);
    return entry.name.endsWith(".spec.ts") && !entry.name.endsWith(".skip.spec.ts")
      ? [fullPath]
      : [];
  });
}
