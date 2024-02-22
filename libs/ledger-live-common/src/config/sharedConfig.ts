import { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";
import { cosmosConfig } from "../families/cosmos/config";
import { bitcoinConfig } from "../families/bitcoin/config";
import { evmConfig } from "../families/evm/config";
import { algorandConfig } from "../families/algorand/config";
import { cardanoConfig } from "../families/cardano/config";
import { casperConfig } from "../families/casper/config";
import { celoConfig } from "../families/celo/config";
import { cryptoOrgConfig } from "../families/crypto_org/config";
import { elrondConfig } from "../families/elrond/config";
import { fileCoinConfig } from "../families/filecoin/config";

const liveCommonConfig: ConfigSchema = {};

export default {
  ...liveCommonConfig,
  ...cosmosConfig,
  ...bitcoinConfig,
  ...evmConfig,
  ...algorandConfig,
  ...cardanoConfig,
  ...casperConfig,
  ...celoConfig,
  ...cryptoOrgConfig,
  ...elrondConfig,
  ...fileCoinConfig,
} as ConfigSchema;
