/**
 * Generates e2e/userdata/generated/ethereum.json for the swap test.
 * Reuses the same harness infrastructure (ts-node + speculos) so no separate CLI build is needed.
 *
 * Usage (from e2e/mobile):
 *   TS_NODE_PROJECT=maestro/harness/tsconfig.json \
 *     ts-node --swc --require tsconfig-paths/register maestro/gen-swap-userdata.ts
 *
 * Requires: SEED, COINAPPS (local Docker) or REMOTE_SPECULOS=true + SPECULINHO_URL.
 * Writes: e2e/userdata/generated/ethereum.json
 */
import "./harness/setup-globals";
import { setEnv } from "@ledgerhq/live-env";
import { startSpeculos, stopSpeculos, specs } from "@ledgerhq/live-common/e2e/speculos";
import { runCliLiveData } from "@ledgerhq/live-common/e2e/runCli";
import fs from "fs";
import path from "path";

// __dirname = e2e/mobile/maestro  →  ../../../ = repo root
const REPO_ROOT = path.resolve(__dirname, "../../..");
const OUT_DIR = process.env.E2E_GENERATED_USERDATA_DIR ?? path.join(REPO_ROOT, "e2e/userdata/generated");
const BASE = path.join(REPO_ROOT, "e2e/mobile/userdata/skip-onboarding.json");
const OUT_PATH = path.join(OUT_DIR, "ethereum.json");

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.copyFileSync(BASE, OUT_PATH);
  console.log(`[gen] output dir: ${OUT_DIR}`);
  console.log(`[gen] base:       ${BASE}`);

  setEnv("MOCK", "");
  process.env.MOCK = "";
  // PLAYWRIGHT_RUN=true suppresses the "no device" check in liveData
  setEnv("PLAYWRIGHT_RUN", true);
  // Without a valid path, getNanoAppCatalogVersionMap hits EISDIR on process.cwd()
  if (!process.env.E2E_NANO_APP_VERSION_PATH) {
    const catalogPath = path.join(OUT_DIR, "nano-app-catalog.json");
    setEnv("E2E_NANO_APP_VERSION_PATH", catalogPath);
    process.env.E2E_NANO_APP_VERSION_PATH = catalogPath;
  }

  console.log("[gen] starting Speculos for Ethereum …");
  const device = await startSpeculos("gen-ethereum", specs["Ethereum"]);
  if (!device) throw new Error("startSpeculos returned null — check SEED / COINAPPS / Docker");

  setEnv("SPECULOS_API_PORT", device.port);
  process.env.SPECULOS_API_PORT = String(device.port);
  console.log(`[gen] Speculos running on port ${device.port}`);

  try {
    await runCliLiveData({
      currency: "Ethereum",
      index: 0,
      add: true,
      appjson: OUT_PATH,
    });
    const written = JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"));
    const count = written?.data?.accounts?.length ?? 0;
    console.log(`[gen] ✓ ethereum.json written — ${count} account(s)`);
    const freshAddress = written?.data?.accounts?.[0]?.data?.freshAddress;
    if (freshAddress) console.log(`[gen]   freshAddress: ${freshAddress}`);
  } finally {
    await stopSpeculos(device.id);
    console.log("[gen] Speculos stopped");
  }
}

main().catch(err => {
  console.error("[gen] FAILED:", err);
  process.exit(1);
});
