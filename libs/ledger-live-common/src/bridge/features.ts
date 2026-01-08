import { supportedFeatures as tezosFeatures } from "@ledgerhq/coin-tezos/supportedFeatures";
import { supportedFeatures as bitcoinFeatures } from "@ledgerhq/coin-bitcoin/supportedFeatures";
import { supportedFeatures as evmFeatures } from "@ledgerhq/coin-evm/supportedFeatures";
import { supportedFeatures as xrpFeatures } from "@ledgerhq/coin-xrp/supportedFeatures";
import { supportedFeatures as tronFeatures } from "@ledgerhq/coin-tron/supportedFeatures";
import { supportedFeatures as solanaFeatures } from "@ledgerhq/coin-solana/supportedFeatures";
import { supportedFeatures as cosmosFeatures } from "@ledgerhq/coin-cosmos/supportedFeatures";
import { supportedFeatures as algorandFeatures } from "@ledgerhq/coin-algorand/supportedFeatures";
import { supportedFeatures as aptosFeatures } from "@ledgerhq/coin-aptos/supportedFeatures";
import { supportedFeatures as cardanoFeatures } from "@ledgerhq/coin-cardano/supportedFeatures";
import { supportedFeatures as nearFeatures } from "@ledgerhq/coin-near/supportedFeatures";
import { supportedFeatures as polkadotFeatures } from "@ledgerhq/coin-polkadot/supportedFeatures";
import { supportedFeatures as minaFeatures } from "@ledgerhq/coin-mina/supportedFeatures";
import { supportedFeatures as filecoinFeatures } from "@ledgerhq/coin-filecoin/supportedFeatures";
import { supportedFeatures as celoFeatures } from "@ledgerhq/coin-celo/supportedFeatures";
import { supportedFeatures as stacksFeatures } from "@ledgerhq/coin-stacks/supportedFeatures";
import { supportedFeatures as vechainFeatures } from "@ledgerhq/coin-vechain/supportedFeatures";
import { supportedFeatures as stellarFeatures } from "@ledgerhq/coin-stellar/supportedFeatures";
import { supportedFeatures as tonFeatures } from "@ledgerhq/coin-ton/supportedFeatures";
import { supportedFeatures as multiversXFeatures } from "@ledgerhq/coin-multiversx/supportedFeatures";
import { supportedFeatures as hederaFeatures } from "@ledgerhq/coin-hedera/supportedFeatures";
import { supportedFeatures as iconFeatures } from "@ledgerhq/coin-icon/supportedFeatures";
import { supportedFeatures as cantonFeatures } from "@ledgerhq/coin-canton/supportedFeatures";
import { supportedFeatures as kaspaFeatures } from "@ledgerhq/coin-kaspa/supportedFeatures";
import { supportedFeatures as suiFeatures } from "@ledgerhq/coin-sui/supportedFeatures";
import { supportedFeatures as internetComputerFeatures } from "@ledgerhq/coin-internet_computer/supportedFeatures";

import { FeaturesMap, FeatureValue } from "@ledgerhq/coin-framework/features/types";

const featuresRegistry = {
  tezos: tezosFeatures,
  bitcoin: bitcoinFeatures,
  evm: evmFeatures,
  xrp: xrpFeatures,
  tron: tronFeatures,
  solana: solanaFeatures,
  cosmos: cosmosFeatures,
  algorand: algorandFeatures,
  aptos: aptosFeatures,
  cardano: cardanoFeatures,
  near: nearFeatures,
  polkadot: polkadotFeatures,
  mina: minaFeatures,
  filecoin: filecoinFeatures,
  celo: celoFeatures,
  stacks: stacksFeatures,
  vechain: vechainFeatures,
  sui: suiFeatures,
  stellar: stellarFeatures,
  internet_computer: internetComputerFeatures,
  ton: tonFeatures,
  multiversx: multiversXFeatures,
  hedera: hederaFeatures,
  icon: iconFeatures,
  canton: cantonFeatures,
  kaspa: kaspaFeatures,
} as const satisfies Record<string, FeaturesMap>;

/**
 * Valid coin family names
 */
export type CoinFamily = keyof typeof featuresRegistry;

/**
 * Get the full features maps for a given currency
 */
export function getFeaturesMap(family: CoinFamily): FeaturesMap | null {
  if (!family) {
    return null;
  }

  const fullDescriptor = featuresRegistry[family];

  if (fullDescriptor) {
    return fullDescriptor;
  }

  return null;
}

export const isSupportedFeature = <K extends keyof FeaturesMap>(
  family: CoinFamily,
  key: K,
  feature: FeatureValue<K>,
): boolean => {
  const features = getFeaturesMap(family);
  if (!features) {
    return false;
  }

  const featureValue = features[key];
  if (!featureValue) {
    return false;
  }

  return (featureValue as readonly FeatureValue<K>[]).includes(feature);
};
