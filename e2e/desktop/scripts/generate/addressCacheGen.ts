import fs from "node:fs";
import path from "node:path";
import { getEnv, setEnv } from "@shared/env";
import { runCliGetAddress } from "@ledgerhq/live-e2e-shared/runCli";
import {
  startSpeculos,
  stopSpeculos,
  specs,
  type SpeculosDevice,
} from "@ledgerhq/live-e2e-shared/speculos";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import {
  setCachedAddressEntry,
  type AddressCacheFile,
} from "@ledgerhq/live-e2e-shared/addressCache";
import type { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { resolveFromRoot } from "./shared";

type AccountToDerive = { index: number; derivationMode: string; accountPath: string };
type CoinGroup = { currency: Currency; accounts: AccountToDerive[] };

const DEFAULT_OUTPUT_DIR = "e2e/userdata/generated";

function resolveOutputDir(outputDir?: string): string {
  return resolveFromRoot(
    outputDir ??
      process.env.E2E_GENERATED_ADDRESSES_DIR ??
      process.env.E2E_GENERATED_USERDATA_DIR ??
      DEFAULT_OUTPUT_DIR,
  );
}

function groupAccountsByCoin(
  isCacheable: (currencyId: string) => boolean,
  coins?: string[],
): Map<string, CoinGroup> {
  const groups = new Map<string, CoinGroup>();
  for (const value of Object.values(Account)) {
    if (!(value instanceof Account) || !value.accountPath) continue;
    const id = value.currency.id;
    if (!isCacheable(id)) continue;
    if (coins?.length && !coins.includes(id)) continue;
    const group = groups.get(id) ?? { currency: value.currency, accounts: [] };
    const derivationMode = value.derivationMode ?? "";
    if (!group.accounts.some(a => a.index === value.index && a.derivationMode === derivationMode)) {
      group.accounts.push({ index: value.index, derivationMode, accountPath: value.accountPath });
    }
    groups.set(id, group);
  }
  return groups;
}

async function generateCoin(
  coinId: string,
  group: CoinGroup,
  cache: AddressCacheFile,
): Promise<string> {
  let device: SpeculosDevice | undefined;
  try {
    const specKey = group.currency.speculosApp.name.replace(/ /g, "_");
    device = await startSpeculos(`addresses-${coinId}`, specs[specKey]);
    if (!device) throw new Error(`Speculos not started for ${specKey}`);

    setEnv("SPECULOS_API_PORT", device.port);
    process.env.SPECULOS_API_PORT = String(device.port);

    for (const { index, derivationMode, accountPath } of group.accounts) {
      const { address } = await runCliGetAddress({
        currency: group.currency.speculosApp.name,
        path: accountPath,
        ...(derivationMode ? { derivationMode } : {}),
      });
      setCachedAddressEntry(cache, coinId, { index, derivationMode, address });
    }

    return `${coinId}: ${group.accounts.length} address(es)`;
  } catch (error) {
    return `${coinId}: FAILED (${error instanceof Error ? error.message : String(error)})`;
  } finally {
    if (device) await stopSpeculos(device.id);
  }
}

export async function generateAddressCache(opts: {
  coin?: string[];
  outputDir?: string;
  outFile: string;
  isCacheable: (currencyId: string) => boolean;
  emptyError: string;
}): Promise<string> {
  const outDir = resolveOutputDir(opts.outputDir);
  fs.mkdirSync(outDir, { recursive: true });

  setEnv("MOCK", "");
  process.env.MOCK = "";
  setEnv("PLAYWRIGHT_RUN", true);

  if (!getEnv("E2E_NANO_APP_VERSION_PATH")) {
    setEnv("E2E_NANO_APP_VERSION_PATH", path.join(outDir, "nano-app-catalog.json"));
  }

  const groups = groupAccountsByCoin(opts.isCacheable, opts.coin);
  if (groups.size === 0) throw new Error(opts.emptyError);

  const outPath = path.join(outDir, opts.outFile);
  const cache: AddressCacheFile = { version: 1, addresses: {} };

  const results: string[] = [];
  for (const [coinId, group] of groups) {
    results.push(await generateCoin(coinId, group, cache));
  }

  fs.writeFileSync(outPath, JSON.stringify(cache), "utf-8");
  results.push(`-> ${outPath}`);
  return results.join("\n");
}
