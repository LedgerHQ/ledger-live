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
// import { supportedFeatures as suiFeatures } from "@ledgerhq/coin-sui/supportedFeatures";
import { supportedFeatures as stellarFeatures } from "@ledgerhq/coin-stellar/supportedFeatures";
// import { supportedFeatures as internetComputerFeatures } from "@ledgerhq/coin-internet-computer/src/supportedFeatures";
import { supportedFeatures as tonFeatures } from "@ledgerhq/coin-ton/supportedFeatures";
import { supportedFeatures as multiversXFeatures } from "@ledgerhq/coin-multiversx/supportedFeatures";
import { supportedFeatures as hederaFeatures } from "@ledgerhq/coin-hedera/supportedFeatures";
import { supportedFeatures as iconFeatures } from "@ledgerhq/coin-icon/supportedFeatures";
import { supportedFeatures as cantonFeatures } from "@ledgerhq/coin-canton/supportedFeatures";
import { supportedFeatures as kaspaFeatures } from "@ledgerhq/coin-kaspa/supportedFeatures";

import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  FeaturesMap,
  BlockchainTxsFeatures,
  StakingTxsFeatures,
  NativeAssetsFeatures,
  DAppsFeatures,
  TokensFeature,
  MemosFeature,
  GasOptionsFeature,
} from "@ledgerhq/coin-framework/features/types";

const features = {
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
  // sui: suiFeatures,
  stellar: stellarFeatures,
  // internet_computer: internetComputerFeatures,
  ton: tonFeatures,
  multiversx: multiversXFeatures,
  hedera: hederaFeatures,
  icon: iconFeatures,
  canton: cantonFeatures,
  kaspa: kaspaFeatures,
};

export const getSupportedFeatures = (
  currency: CryptoOrTokenCurrency,
  key: keyof FeaturesMap,
): unknown[] => {
  const family = currency.id;
  const familyFeatures = features[family];
  return (familyFeatures?.[key] as unknown[]) || [];
};

export const hasStakingFeature = (
  currency: CryptoOrTokenCurrency,
  key: StakingTxsFeatures,
): boolean => {
  const family = currency.id;
  return features[family]?.staking?.includes(key) || false;
};

export const hasBlockchainFeature = (
  currency: CryptoOrTokenCurrency,
  key: BlockchainTxsFeatures,
): boolean => {
  const family = currency.id;
  return features[family]?.blockchain?.includes(key) || false;
};

export const hasNativeAssetsFeature = (
  currency: CryptoOrTokenCurrency,
  key: NativeAssetsFeatures,
): boolean => {
  const family = currency.id;
  return features[family]?.native_assets?.includes(key) || false;
};

export const hasDAppsFeature = (currency: CryptoOrTokenCurrency, key: DAppsFeatures): boolean => {
  const family = currency.id;
  return features[family]?.dApps?.includes(key) || false;
};

export const hasMemosFeature = (currency: CryptoOrTokenCurrency, key: MemosFeature): boolean => {
  const family = currency.id;
  return features[family]?.memos?.includes(key) || false;
};

export const hasTokensFeature = (currency: CryptoOrTokenCurrency, key: TokensFeature): boolean => {
  const family = currency.id;
  return features[family]?.tokens?.includes(key) || false;
};

export const hasGasOptionsFeature = (
  currency: CryptoOrTokenCurrency,
  key: GasOptionsFeature,
): boolean => {
  const family = currency.id;
  return features[family]?.gasOptions?.includes(key) || false;
};
