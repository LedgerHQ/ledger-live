import chalk from "chalk";
import * as compose from "docker-compose";

export async function spawnAgave() {
  console.log("Starting Agave...");
  await compose.upOne("agave", {
    cwd: __dirname,
    log: Boolean(process.env.DEBUG),
    env: process.env,
  });

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
