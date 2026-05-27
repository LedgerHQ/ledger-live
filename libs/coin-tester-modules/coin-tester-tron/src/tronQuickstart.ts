import chalk from "chalk";
import * as compose from "docker-compose";
import { TRON_LOCAL_RPC } from "./fixtures";
import { buildTronTestSignerFromPrivateKeyHex, type TronTestSigner } from "./signer";

export type PrefundedAccount = {
  privateKey: string;
  signer: TronTestSigner;
  address: string;
};

export async function spawnTronQuickstart(): Promise<void> {
  console.log("Starting tronbox/tre…");
  await compose.upOne("tron", {
    cwd: __dirname,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--wait"],
  });
  console.log(chalk.bgBlueBright(" -  TRON QUICKSTART READY ✅  - "));
}

export async function killTronQuickstart(): Promise<void> {
  console.log("Stopping tronbox/tre…");
  await compose.down({
    cwd: __dirname,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans", "--volumes"],
  });
}

type AdminAccountsResponse = {
  hdPath: string;
  mnemonic: string;
  privateKeys: string[];
};

export async function getPrefundedAccounts(): Promise<PrefundedAccount[]> {
  const deadline = Date.now() + 60_000;
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${TRON_LOCAL_RPC}/admin/accounts-json`);
      if (res.ok) {
        const text = await res.text();
        if (text.length > 0) {
          const body = JSON.parse(text) as AdminAccountsResponse;
          if (Array.isArray(body.privateKeys) && body.privateKeys.length > 0) {
            return body.privateKeys.map(privateKey => {
              const signer = buildTronTestSignerFromPrivateKeyHex(privateKey);
              return { privateKey, signer, address: signer.address };
            });
          }
          lastError = new Error("/admin/accounts-json returned empty privateKeys");
        } else {
          lastError = new Error("/admin/accounts-json returned empty body");
        }
      } else {
        lastError = new Error(`/admin/accounts-json → HTTP ${res.status}`);
      }
    } catch (err) {
      lastError = err;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`getPrefundedAccounts timed out: ${String(lastError)}`);
}
