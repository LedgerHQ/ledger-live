import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { EnvName, setEnv, setEnvUnsafe } from "@ledgerhq/live-env";
import { listen } from "@ledgerhq/logs";
import winston from "winston";
import { liveConfig } from "../../config/sharedConfig";
import { registerAllCoins } from "../../coin-modules/load-all-coins";

registerAllCoins();
import { WALLET_API_VERSION } from "../../wallet-api/constants";
import { setWalletAPIVersion } from "../../wallet-api/version";

setWalletAPIVersion(WALLET_API_VERSION);
LiveConfig.setConfig(liveConfig);

for (const k in process.env) setEnvUnsafe(k as EnvName, process.env[k]);

const { VERBOSE, VERBOSE_FILE } = process.env;
const logger = winston.createLogger({
  level: "debug",
  transports: [],
});
const { format } = winston;
const { combine, timestamp, json } = format;
const winstonFormat = combine(timestamp(), json());

if (VERBOSE_FILE) {
  logger.add(
    new winston.transports.File({
      format: winstonFormat,
      filename: VERBOSE_FILE,
      level: "debug",
    }),
  );
}

logger.add(
  new winston.transports.Console({
    format: winstonFormat,
    silent: !VERBOSE,
  }),
);
// eslint-disable-next-line no-unused-vars
listen(({ type, message, ...rest }) => {
  logger.log("debug", {
    message: type + (message ? ": " + message : ""),
    // $FlowFixMe
    ...rest,
  });
});

const value = "ll-ci/0.0.0";
setEnv("LEDGER_CLIENT_VERSION", value);
