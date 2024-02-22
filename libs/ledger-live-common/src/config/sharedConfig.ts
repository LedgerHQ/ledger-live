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
import { hederaConfig } from "../families/hedera/config";
import { internetComputerConfig } from "../families/internet_computer/config";
import { polkadotConfig } from "../families/polkadot/config";
import { rippleConfig } from "../families/ripple/config";
import { nearConfig } from "../families/near/config";
import { solanaConfig } from "../families/solana/config";
import { stacksConfig } from "../families/stacks/config";
import { stellarConfig } from "../families/stellar/config";
import { tezosConfig } from "../families/tezos/config";
import { tronConfig } from "../families/tron/config";
import { vechainConfig } from "../families/vechain/config";

const liveCommonConfig: ConfigSchema = {};

export default {
  ...liveCommonConfig,
  ...algorandConfig,
  ...bitcoinConfig,
  ...cosmosConfig,
  ...cardanoConfig,
  ...casperConfig,
  ...celoConfig,
  ...cryptoOrgConfig,
  ...elrondConfig,
  ...evmConfig,
  ...fileCoinConfig,
  ...hederaConfig,
  ...internetComputerConfig,
  ...nearConfig,
  ...polkadotConfig,
  ...rippleConfig,
  ...solanaConfig,
  ...stacksConfig,
  ...stellarConfig,
  ...tezosConfig,
  ...tronConfig,
  ...vechainConfig,
} as ConfigSchema;
