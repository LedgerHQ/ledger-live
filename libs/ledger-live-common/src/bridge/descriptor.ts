import type { CryptoOrTokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  SendDescriptor,
  CoinDescriptor,
  FeatureId,
} from "@ledgerhq/coin-framework/features/types";
import { getCurrencyBridge } from "./impl";
import { getCurrencyConfiguration } from "../config/index";
import { descriptor as algorandDescriptor } from "../families/algorand/descriptor";
import { descriptor as aptosDescriptor } from "../families/aptos/descriptor";
import { descriptor as bitcoinDescriptor } from "../families/bitcoin/descriptor";
import { descriptor as cantonDescriptor } from "../families/canton/descriptor";
import { descriptor as cardanoDescriptor } from "../families/cardano/descriptor";
import { descriptor as casperDescriptor } from "../families/casper/descriptor";
import { descriptor as celoDescriptor } from "../families/celo/descriptor";
import { descriptor as cosmosDescriptor } from "../families/cosmos/descriptor";
import { descriptor as evmDescriptor } from "../families/evm/descriptor";
import { descriptor as filecoinDescriptor } from "../families/filecoin/descriptor";
import { descriptor as hederaDescriptor } from "../families/hedera/descriptor";
import { descriptor as iconDescriptor } from "../families/icon/descriptor";
import { descriptor as internetComputerDescriptor } from "../families/internet_computer/descriptor";
import { descriptor as kaspaDescriptor } from "../families/kaspa/descriptor";
import { descriptor as minaDescriptor } from "../families/mina/descriptor";
import { descriptor as multiversxDescriptor } from "../families/multiversx/descriptor";
import { descriptor as nearDescriptor } from "../families/near/descriptor";
import { descriptor as polkadotDescriptor } from "../families/polkadot/descriptor";
import { descriptor as solanaDescriptor } from "../families/solana/descriptor";
import { descriptor as stacksDescriptor } from "../families/stacks/descriptor";
import { descriptor as stellarDescriptor } from "../families/stellar/descriptor";
import { descriptor as suiDescriptor } from "../families/sui/descriptor";
import { descriptor as tezosDescriptor } from "../families/tezos/descriptor";
import { descriptor as tonDescriptor } from "../families/ton/descriptor";
import { descriptor as tronDescriptor } from "../families/tron/descriptor";
import { descriptor as vechainDescriptor } from "../families/vechain/descriptor";
import { descriptor as xrpDescriptor } from "../families/xrp/descriptor";

export const newFlowsConfig: Record<
  string,
  { send?: boolean; staking?: boolean; receive?: boolean }
> = {
  algorand: { send: true },
  aptos: { send: true },
  bitcoin: { send: true },
  canton: { send: true },
  cardano: { send: true },
  casper: { send: true },
  celo: { send: true },
  cosmos: { send: true },
  evm: { send: true },
  filecoin: { send: true },
  hedera: { send: true },
  icon: { send: true },
  internet_computer: { send: true },
  kaspa: { send: true },
  mina: { send: true },
  multiversx: { send: true },
  near: { send: true },
  polkadot: { send: true },
  solana: { send: true },
  stacks: { send: true },
  stellar: { send: true },
  sui: { send: true },
  tezos: { send: true },
  ton: { send: true },
  tron: { send: true },
  vechain: { send: true },
  xrp: { send: true },
};

const descriptorRegistry: Record<string, CoinDescriptor> = {
  algorand: algorandDescriptor,
  aptos: aptosDescriptor,
  bitcoin: bitcoinDescriptor,
  canton: cantonDescriptor,
  cardano: cardanoDescriptor,
  casper: casperDescriptor,
  celo: celoDescriptor,
  cosmos: cosmosDescriptor,
  evm: evmDescriptor,
  filecoin: filecoinDescriptor,
  hedera: hederaDescriptor,
  icon: iconDescriptor,
  internet_computer: internetComputerDescriptor,
  kaspa: kaspaDescriptor,
  mina: minaDescriptor,
  multiversx: multiversxDescriptor,
  near: nearDescriptor,
  polkadot: polkadotDescriptor,
  solana: solanaDescriptor,
  stacks: stacksDescriptor,
  stellar: stellarDescriptor,
  sui: suiDescriptor,
  tezos: tezosDescriptor,
  ton: tonDescriptor,
  tron: tronDescriptor,
  vechain: vechainDescriptor,
  xrp: xrpDescriptor,
};

function isFeatureActive(currency: CryptoCurrency, featureId: FeatureId): boolean {
  try {
    const currencyConfig = getCurrencyConfiguration(currency);

    if (currencyConfig.status.type !== "active") {
      return false;
    }

    if (!currencyConfig.status.features) {
      return true;
    }

    const feature = currencyConfig.status.features.find((f: { id: string }) => f.id === featureId);
    if (!feature) {
      return false;
    }

    return feature.status === "active";
  } catch {
    return false;
  }
}

/**
 * Get the full descriptor for a given currency via the CurrencyBridge
 */
export function getDescriptor(currency: CryptoOrTokenCurrency | undefined): CoinDescriptor | null {
  if (!currency) {
    return null;
  }

  const cryptoCurrency = currency.type === "TokenCurrency" ? currency.parentCurrency : currency;
  const bridge = getCurrencyBridge(cryptoCurrency);

  // Check if bridge implements getDescriptor directly
  if (bridge.getDescriptor) {
    return bridge.getDescriptor(cryptoCurrency) as CoinDescriptor;
  }

  // Fallback: use the descriptor registry and check feature flags
  const fullDescriptor = descriptorRegistry[cryptoCurrency.family];

  if (!fullDescriptor) {
    return null;
  }

  if (fullDescriptor.send && isFeatureActive(cryptoCurrency, "blockchain_txs")) {
    return fullDescriptor;
  }

  return null;
}

/**
 * Get the send flow descriptor for a given currency
 */
export function getSendDescriptor(
  currency: CryptoOrTokenCurrency | undefined,
): SendDescriptor | null {
  const descriptor = getDescriptor(currency);
  return descriptor?.send ?? null;
}

/*
 * Check if the currency supports the new flows
 */
export function supportsNewFlows(
  currency: CryptoOrTokenCurrency,
  flow: "send" | "staking" | "receive",
): boolean {
  const cryptoCurrency = currency.type === "TokenCurrency" ? currency.parentCurrency : currency;
  return newFlowsConfig[cryptoCurrency.family]?.[flow] ?? false;
}

/**
 * Helper functions to check send flow capabilities
 */
export const sendFeatures = {
  hasMemo: (currency: CryptoOrTokenCurrency | undefined): boolean => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.inputs.memo !== undefined;
  },
  hasFeePresets: (currency: CryptoOrTokenCurrency | undefined): boolean => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.fees.hasPresets ?? false;
  },
  hasCustomFees: (currency: CryptoOrTokenCurrency | undefined): boolean => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.fees.hasCustom ?? false;
  },
  hasCoinControl: (currency: CryptoOrTokenCurrency | undefined): boolean => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.fees.hasCoinControl ?? false;
  },
  getMemoType: (currency: CryptoOrTokenCurrency | undefined) => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.inputs.memo?.type;
  },
  getMemoMaxLength: (currency: CryptoOrTokenCurrency | undefined) => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.inputs.memo?.maxLength;
  },
  getMemoMaxValue: (currency: CryptoOrTokenCurrency | undefined) => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.inputs.memo?.maxValue;
  },
  getMemoOptions: (currency: CryptoOrTokenCurrency | undefined) => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.inputs.memo?.options;
  },
  supportsDomain: (currency: CryptoOrTokenCurrency | undefined): boolean => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.inputs.recipientSupportsDomain ?? false;
  },
};
