import { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";
import { appConfig } from "../apps/config";
import { algorandConfig } from "../families/algorand/config";
import { bitcoinConfig } from "../families/bitcoin/config";
import { cardanoConfig } from "../families/cardano/config";
import { casperConfig } from "../families/casper/config";
import { celoConfig } from "../families/celo/config";
import { cosmosConfig } from "../families/cosmos/config";
import { elrondConfig } from "../families/elrond/config";
import { evmConfig } from "../families/evm/config";
import { fileCoinConfig } from "../families/filecoin/config";
import { hederaConfig } from "../families/hedera/config";
import { internetComputerConfig } from "../families/internet_computer/config";
import { nearConfig } from "../families/near/config";
import { polkadotConfig } from "../families/polkadot/config";
import { xrpConfig } from "../families/xrp/config";
import { solanaConfig } from "../families/solana/config";
import { stacksConfig } from "../families/stacks/config";
import { stellarConfig } from "../families/stellar/config";
import { tezosConfig } from "../families/tezos/config";
import { tonConfig } from "../families/ton/config";
import { tronConfig } from "../families/tron/config";
import { vechainConfig } from "../families/vechain/config";
import { iconConfig } from "../families/icon/config";

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

const liveCommonConfig: ConfigSchema = {
  ...appConfig,
};

export const liveConfig: ConfigSchema = {
  ...countervaluesConfig,
  ...liveCommonConfig,
  ...algorandConfig,
  ...bitcoinConfig,
  ...cardanoConfig,
  ...casperConfig,
  ...celoConfig,
  ...cosmosConfig,
  ...elrondConfig,
  ...evmConfig,
  ...fileCoinConfig,
  ...hederaConfig,
  ...internetComputerConfig,
  ...nearConfig,
  ...polkadotConfig,
  ...xrpConfig,
  ...solanaConfig,
  ...stacksConfig,
  ...stellarConfig,
  ...tezosConfig,
  ...tronConfig,
  ...vechainConfig,
  ...iconConfig,
  ...tonConfig,
};
