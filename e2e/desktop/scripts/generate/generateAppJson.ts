import fs from "node:fs";
import path from "node:path";
import { getEnv, setEnv } from "@shared/live-env";
import { runCliLiveData } from "@ledgerhq/live-e2e-shared/runCli";
import {
  startSpeculos,
  stopSpeculos,
  specs,
  type SpeculosDevice,
} from "@ledgerhq/live-e2e-shared/speculos";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import type { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { resolveFromRoot, runGenerator, type GeneratorArgs } from "./shared";

type CoinGroup = {
  currency: Currency;
  accounts: { index: number; scheme?: string }[];
};

const DEFAULT_OUTPUT_DIR = "e2e/userdata/generated";
const DEFAULT_BASE = "e2e/desktop/tests/userdata/skip-onboarding-with-last-seen-device.json";

function groupAccountsByCoin(coins?: string[]): Map<string, CoinGroup> {
  const groups = new Map<string, CoinGroup>();
  for (const value of Object.values(Account)) {
    if (!(value instanceof Account) || !value.accountPath) continue;
    const id = value.currency.id;
    if (id.includes("/")) continue;
    if (coins?.length && !coins.includes(id)) continue;
    const group = groups.get(id) ?? { currency: value.currency, accounts: [] };
    const scheme = value.derivationMode || undefined;
    if (!group.accounts.some(a => a.index === value.index && a.scheme === scheme)) {
      group.accounts.push({ index: value.index, scheme });
    }
    groups.set(id, group);
  }
  return groups;
}

async function generateCoin(
  coinId: string,
  group: CoinGroup,
  outDir: string,
  baseTemplate: string,
): Promise<string> {
  let device: SpeculosDevice | undefined;
  try {
    const specKey = group.currency.speculosApp.name.replace(/ /g, "_");
    device = await startSpeculos(`generate-${coinId}`, specs[specKey]);
    if (!device) throw new Error(`Speculos not started for ${specKey}`);

    setEnv("SPECULOS_API_PORT", device.port);
    process.env.SPECULOS_API_PORT = String(device.port);

    const outPath = path.join(outDir, `${coinId}.json`);
    fs.copyFileSync(baseTemplate, outPath);

    for (const { index, scheme } of group.accounts) {
      await runCliLiveData({
        currency: group.currency.speculosApp.name,
        index,
        ...(scheme ? { scheme } : {}),
        add: true,
        appjson: outPath,
      });
    }

    const written = JSON.parse(fs.readFileSync(outPath, "utf-8"));
    const count = written?.data?.accounts?.length ?? 0;
    return `${coinId}: ${count} account(s) -> ${outPath}`;
  } catch (error) {
    return `${coinId}: FAILED (${error instanceof Error ? error.message : String(error)})`;
  } finally {
    if (device) await stopSpeculos(device.id);
  }
}

async function generateAppJson({ coin, outputDir, base }: GeneratorArgs): Promise<string> {
  const outDir = resolveFromRoot(
    outputDir ?? process.env.E2E_GENERATED_USERDATA_DIR ?? DEFAULT_OUTPUT_DIR,
  );
  fs.mkdirSync(outDir, { recursive: true });

  const baseTemplate = resolveFromRoot(base ?? DEFAULT_BASE);
  if (!fs.existsSync(baseTemplate)) throw new Error(`base userdata not found: ${baseTemplate}`);

  setEnv("MOCK", "");
  process.env.MOCK = "";
  setEnv("PLAYWRIGHT_RUN", true);

  if (!getEnv("E2E_NANO_APP_VERSION_PATH")) {
    setEnv("E2E_NANO_APP_VERSION_PATH", path.join(outDir, "nano-app-catalog.json"));
  }

  const groups = groupAccountsByCoin(coin);
  if (groups.size === 0) throw new Error("no matching coin found");

  const results: string[] = [];
  for (const [coinId, group] of groups) {
    results.push(await generateCoin(coinId, group, outDir, baseTemplate));
  }
  return results.join("\n");
}

runGenerator(generateAppJson);
