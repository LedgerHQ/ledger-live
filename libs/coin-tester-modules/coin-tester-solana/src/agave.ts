import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const composeOptions = {
  cwd: PACKAGE_ROOT,
  log: Boolean(process.env.DEBUG),
  env: process.env,
};

export async function spawnAgave() {
  console.log("Starting Agave...");
  await compose.upOne("agave", {
    ...composeOptions,
    commandOptions: ["--wait"],
  });

  console.log(chalk.bgBlueBright(" -  AGAVE READY ✅  - "));
}

export async function killAgave() {
  console.log("Stopping Agave...");
  await compose.down({
    ...composeOptions,
    commandOptions: ["--remove-orphans", "--volumes"],
  });
}

export async function airdrop(address: string, amount: number) {
  return new Promise<void>((resolve, reject) => {
    compose
      .exec("agave", `solana airdrop ${amount} ${address} -ul`, {
        ...composeOptions,
        callback: chunck => {
          if (/Signature:/.test(chunck.toString())) {
            resolve();
          }
        },
      })
      .catch(() => reject(new Error("Failed to airdrop")));
  });
}
