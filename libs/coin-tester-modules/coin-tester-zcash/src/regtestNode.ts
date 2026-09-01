import { readFileSync, writeFileSync } from "node:fs";
import chalk from "chalk";
import * as compose from "docker-compose";
import { toRegtestAddress } from "./regtestAddress";

export const ZEBRA_RPC_URL = "http://127.0.0.1:18232";
export const ZAINO_GRPC_URL = "http://127.0.0.1:8137";

const DOCKER_DIR = `${__dirname}/docker`;

/**
 * Materializes `zebra.toml` from its template, substituting the tester's own
 * transparent address (re-encoded to its regtest form -- see
 * regtestAddress.ts; zebra's own config parser rejects a mainnet-encoded
 * address for `mining.miner_address` with "Not a Zcash address", empirically
 * confirmed) as zebra's mining target, so the account under test receives
 * every coinbase reward directly (no separate funding transaction step;
 * `should_allow_unshielded_coinbase_spends` makes it immediately spendable).
 */
function writeZebraConfig(minerAddress: string): void {
  const template = readFileSync(`${DOCKER_DIR}/zebra.toml.template`, "utf8");
  const regtestMinerAddress = toRegtestAddress(minerAddress);
  writeFileSync(
    `${DOCKER_DIR}/zebra.toml`,
    template.replace("{{MINER_ADDRESS}}", regtestMinerAddress),
  );
}

export const spawnRegtestNode = async (minerAddress: string): Promise<void> => {
  writeZebraConfig(minerAddress);

  console.log("Starting zebra + zaino regtest stack...");
  await compose.upAll({
    cwd: DOCKER_DIR,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--wait"],
  });

  console.log(chalk.bgBlueBright(" -  ZEBRA + ZAINO REGTEST READY ✅  - "));
};

export const killRegtestNode = async (): Promise<void> => {
  console.log("Stopping zebra + zaino regtest stack...");
  await compose.down({
    cwd: DOCKER_DIR,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans", "--volumes"],
  });
};
