import path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import chalk from "chalk";
import * as compose from "docker-compose";
import { toRegtestAddress } from "./regtestAddress";

export const ZEBRA_RPC_URL = "http://127.0.0.1:18232";
export const ZAINO_GRPC_URL = "http://127.0.0.1:8137";

// docker-compose.yml + its templates live at src/docker/, never copied by tsc
// (outDir only compiles .ts), so this always resolves there whether this
// module runs from src/ (ts-jest) or from its compiled lib/ counterpart --
// same pattern as coin-tester-cosmos's babylond.ts.
const DOCKER_DIR = path.resolve(__dirname, "..", "src", "docker");

/**
 * Materializes `zebra.toml` from its template, substituting the tester's own
 * transparent address (re-encoded to its regtest form -- see
 * regtestAddress.ts; zebra's own config parser rejects a mainnet-encoded
 * address for `mining.miner_address` with "Not a Zcash address", empirically
 * confirmed) as zebra's mining target, so the account under test receives
 * every coinbase reward directly (no separate funding transaction step;
 * `should_allow_unshielded_coinbase_spends` makes it immediately spendable).
 *
 * `nu7ActivationHeight` schedules NU7 at that height; left undefined, NU7
 * stays unscheduled, which is zebra's Regtest default.
 */
export function writeZebraConfig(
  minerAddress: string,
  nu7ActivationHeight?: number,
  dockerDir: string = DOCKER_DIR,
): void {
  const template = readFileSync(`${dockerDir}/zebra.toml.template`, "utf8");
  const regtestMinerAddress = toRegtestAddress(minerAddress);
  const nu7Line = nu7ActivationHeight === undefined ? "" : `NU7 = ${nu7ActivationHeight}`;
  writeFileSync(
    `${dockerDir}/zebra.toml`,
    template
      .replace("{{MINER_ADDRESS}}", regtestMinerAddress)
      .replace("{{NU7_ACTIVATION}}", nu7Line),
  );
}

export type RegtestNodeOptions = {
  /** Height at which zebra schedules NU7. Unscheduled when omitted. */
  nu7ActivationHeight?: number;
};

export const spawnRegtestNode = async (
  minerAddress: string,
  options: RegtestNodeOptions = {},
): Promise<void> => {
  writeZebraConfig(minerAddress, options.nu7ActivationHeight);

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
