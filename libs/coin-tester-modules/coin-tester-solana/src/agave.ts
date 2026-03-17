import chalk from "chalk";
import * as compose from "docker-compose";

async function waitForRpc(maxRetries = 30, intervalMs = 2000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch("http://127.0.0.1:8899", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
      });
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error("Agave RPC did not become healthy in time");
}

export async function spawnAgave() {
  console.log("Starting Agave...");
  await compose.upOne("agave", {
    cwd: __dirname,
    log: Boolean(process.env.DEBUG),
    env: process.env,
  });

  await waitForRpc();
  console.log(chalk.bgBlueBright(" -  AGAVE READY ✅  - "));
}

export async function killAgave() {
  console.log("Stopping Agave...");
  await compose.down({
    cwd: __dirname,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans"],
  });
}

export async function airdrop(address: string, amount: number) {
  // -ul is short for url localnet
  return new Promise<void>((resolve, reject) => {
    compose
      .exec("agave", `solana airdrop ${amount} ${address} -ul`, {
        callback: chunck => {
          if (/Signature:/.test(chunck.toString())) {
            resolve();
          }
        },
      })
      .catch(() => reject(new Error("Failed to airdrop")));
  });
}
