import chalk from "chalk";
import * as compose from "docker-compose";

// Each cluster has its own `agave-<cluster>` service in docker-compose.yml
export type AgaveCluster = "mainnet" | "devnet";

export async function spawnAgave(cluster: AgaveCluster) {
  console.log(`Starting Agave (${cluster})...`);
  await compose.upOne(`agave-${cluster}`, {
    cwd: __dirname,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--wait"],
  });

  console.log(chalk.bgBlueBright(" -  AGAVE READY ✅  - "));
}

export async function killAgave() {
  console.log("Stopping Agave...");
  await compose.down({
    cwd: __dirname,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans", "--volumes"],
  });
}

export async function airdrop(cluster: AgaveCluster, address: string, amount: number) {
  // -ul is short for url localnet
  return new Promise<void>((resolve, reject) => {
    compose
      .exec(`agave-${cluster}`, `solana airdrop ${amount} ${address} -ul`, {
        callback: chunck => {
          if (/Signature:/.test(chunck.toString())) {
            resolve();
          }
        },
      })
      .catch(() => reject(new Error("Failed to airdrop")));
  });
}
