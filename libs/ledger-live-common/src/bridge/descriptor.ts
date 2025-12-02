import type { CryptoOrTokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { FeatureId, FeatureConfig } from "@ledgerhq/coin-framework/features/types";
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

/**
 * Memo field type configuration
 */
export type MemoType =
  | "text" // Simple text memo (cosmos, solana, algorand)
  | "tag" // Numeric tag (xrp destination tag, casper transfer id)
  | "typed"; // Typed memo with predefined options (stellar)

/**
 * Input field types for descriptors
 */
export type InputFieldType = "text" | "number" | "tag" | "typed";

/**
 * Input field descriptor for a transaction flow
 */
export type InputDescriptor = Readonly<{
  type: InputFieldType;
  maxLength?: number;
  maxValue?: number;
  options?: readonly string[];
  supportsDomain?: boolean; // Whether the field supports domain names (ENS for EVM)
}>;

/**
 * Fee input options
 */
export type FeeDescriptor = {
  hasPresets: boolean;
  hasCustom: boolean;
  hasCoinControl?: boolean;
};

/**
 * Send flow descriptor defining inputs for the send transaction
 */
export type SendDescriptor = {
  inputs: {
    recipientSupportsDomain?: boolean; // Whether recipient field supports domain names (ENS for EVM)
    memo?: InputDescriptor;
  };
  fees: FeeDescriptor;
};

/**
 * Complete flow descriptors for a coin
 */
export type CoinDescriptor = {
  send: SendDescriptor;
  // Future: stake, swap, etc.
};

type MemoApplicationFn = (
  memoValue: string | number | undefined,
  currentTransaction: Record<string, unknown>,
) => Record<string, unknown>;

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

    // Type guard
    const features = (currencyConfig.status as { type: "active"; features?: FeatureConfig[] })
      .features;
    return features?.find(f => f.id === featureId)?.status === "active";
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
  if ("getDescriptor" in bridge && typeof bridge.getDescriptor === "function") {
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

/**
 * Helper functions to check send flow capabilities
 */
const memoApplicationRegistry: Record<string, MemoApplicationFn> = {
  solana: (memo, transaction) => {
    const currentModel = (transaction.model as Record<string, unknown> | undefined) || {};
    const currentUiState = (currentModel.uiState as Record<string, unknown> | undefined) || {};
    return {
      model: {
        ...currentModel,
        uiState: {
          ...currentUiState,
          memo,
        },
      },
    };
  },
  casper: memo => ({ transferId: memo }),
  xrp: memo => {
    if (typeof memo === "number") return { tag: memo };
    if (typeof memo === "string") return { tag: Number(memo) };
    return { tag: undefined };
  },
  stellar: memo => ({ memoValue: memo }),
  ton: (memo, transaction) => {
    const currentComment = (transaction.comment as Record<string, unknown> | undefined) || {};
    return {
      comment: {
        ...currentComment,
        text: memo,
      },
    };
  },
};

export function applyMemoToTransaction(
  family: string,
  memoValue: string | number | undefined,
  currentTransaction: Record<string, unknown> = {},
): Record<string, unknown> {
  const applyFn = memoApplicationRegistry[family];
  if (!applyFn) {
    return { memo: memoValue };
  }
  return applyFn(memoValue, currentTransaction);
}

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
