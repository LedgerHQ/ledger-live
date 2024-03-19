import { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";
import { algorandConfig } from "../families/algorand/config";
import { bitcoinConfig } from "../families/bitcoin/config";
import { cardanoConfig } from "../families/cardano/config";
import { casperConfig } from "../families/casper/config";
import { celoConfig } from "../families/celo/config";
import { cosmosConfig } from "../families/cosmos/config";
import { cryptoOrgConfig } from "../families/crypto_org/config";
import { elrondConfig } from "../families/elrond/config";
import { evmConfig } from "../families/evm/config";
import { fileCoinConfig } from "../families/filecoin/config";
import { hederaConfig } from "../families/hedera/config";
import { internetComputerConfig } from "../families/internet_computer/config";
import { nearConfig } from "../families/near/config";
import { polkadotConfig } from "../families/polkadot/config";
import { rippleConfig } from "../families/ripple/config";
import { solanaConfig } from "../families/solana/config";
import { stacksConfig } from "../families/stacks/config";
import { stellarConfig } from "../families/stellar/config";
import { tezosConfig } from "../families/tezos/config";
import { tronConfig } from "../families/tron/config";
import { vechainConfig } from "../families/vechain/config";

const liveCommonConfig: ConfigSchema = {};

export const liveConfig: ConfigSchema = {
  ...liveCommonConfig,
  ...algorandConfig,
  ...bitcoinConfig,
  ...cardanoConfig,
  ...casperConfig,
  ...celoConfig,
  ...cosmosConfig,
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
};
