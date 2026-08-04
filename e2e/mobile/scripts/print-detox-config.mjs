#!/usr/bin/env node
// Prints the config Detox actually resolves, so config changes can be verified without a device.
//
//   node scripts/print-detox-config.mjs [configuration] [...extra detox CLI args]
//   node scripts/print-detox-config.mjs android.emu.release --record-logs failing
//
// Pass the CLI flags CI uses to confirm a config change keeps CI parity.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { composeDetoxConfig } = require("detox/src/configuration");

const [configuration = "ios.sim.debug", ...rest] = process.argv.slice(2);

// Detox parses its CLI with yargs, so scalars have to be coerced to match the config it resolves.
const coerce = value => {
  if (value === "true") return true;
  if (value === "false") return false;
  return /^-?\d+$/.test(value) ? Number(value) : value;
};

const argv = { configuration };
for (let i = 0; i < rest.length; i++) {
  const arg = rest[i];
  if (!arg.startsWith("--")) continue;
  const eq = arg.indexOf("=");
  if (eq !== -1) {
    argv[arg.slice(2, eq)] = coerce(arg.slice(eq + 1));
    continue;
  }
  const next = rest[i + 1];
  const hasValue = next !== undefined && !next.startsWith("--");
  argv[arg.slice(2)] = hasValue ? coerce(next) : true;
  if (hasValue) i++;
}

const config = await composeDetoxConfig({ argv });

console.log(
  JSON.stringify(
    {
      configuration,
      device: config.device,
      retries: config.testRunner.retries,
      logger: { level: config.logger.level },
      session: { debugSynchronization: config.session.debugSynchronization },
      artifacts: config.artifacts,
    },
    null,
    2,
  ),
);
