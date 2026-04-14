import type { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";
import { appConfig } from "@ledgerhq/live-common/apps/config";
import { bitcoinConfig } from "@ledgerhq/live-common/families/bitcoin/config";
import { evmConfig } from "@ledgerhq/live-common/families/evm/config";
import { solanaConfig } from "@ledgerhq/live-common/families/solana/config";

const countervaluesConfig: ConfigSchema = {
  config_countervalues_refreshRate: {
    type: "number",
    default: 60 * 1000,
  },
  config_countervalues_marketCapBatchingAfterRank: {
    type: "number",
    default: 20,
  },
};

export const walletCliConfig: ConfigSchema = {
  ...countervaluesConfig,
  ...appConfig,
  ...bitcoinConfig,
  ...evmConfig,
  ...solanaConfig,
};
