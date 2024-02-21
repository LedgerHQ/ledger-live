import { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";
import { cosmosConfig } from "../families/cosmos/config";
import { bitcoinConfig } from "../families/bitcoin/config";
import { evmConfig } from "../families/evm/config";

const liveCommonConfig: ConfigSchema = {};

export default {
  ...liveCommonConfig,
  ...cosmosConfig,
  ...bitcoinConfig,
  ...evmConfig,
} as ConfigSchema;
