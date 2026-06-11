import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";
import type { TronSigner } from "@ledgerhq/coin-tron/types/signer";
import { TRON_LOCAL_RPC } from "./fixtures";
import { buildTronTestSignerFromPrivateKeyHex } from "./signer";

export type PrefundedAccount = {
  privateKey: string;
  signer: TronSigner;
  address: string;
};

const PACKAGE_ROOT = path.resolve(__dirname, "..");

const composeOpts = () => ({
  cwd: PACKAGE_ROOT,
  log: Boolean(process.env.DEBUG),
  env: process.env,
});

export async function spawnTronbox(): Promise<void> {
  console.log("Starting tronbox/tre…");
  await compose.upOne("tron", { ...composeOpts(), commandOptions: ["--wait"] });
  console.log(chalk.bgBlueBright(" -  TRONBOX READY ✅  - "));
}

export async function killTronbox(): Promise<void> {
  console.log("Stopping tronbox/tre…");
  await compose.down({ ...composeOpts(), commandOptions: ["--remove-orphans", "--volumes"] });
}

export async function getPrefundedAccounts(): Promise<PrefundedAccount[]> {
  const deadline = Date.now() + 60_000;
  let lastError = "polling never started";
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${TRON_LOCAL_RPC}/admin/accounts-json`);
      const body = res.ok ? ((await res.json()) as { privateKeys?: string[] }) : null;
      if (body?.privateKeys?.length) {
        return body.privateKeys.map(privateKey => {
          const { signer, address } = buildTronTestSignerFromPrivateKeyHex(privateKey);
          return { privateKey, signer, address };
        });
      }
      lastError = `/admin/accounts-json → ${res.status} (empty)`;
    } catch (err) {
      lastError = String(err);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`getPrefundedAccounts timed out: ${lastError}`);
}
