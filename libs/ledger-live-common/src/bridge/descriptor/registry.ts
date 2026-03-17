import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyBridge } from "../impl";
import { descriptor as algorandDescriptor } from "../../families/algorand/descriptor";
import { descriptor as aptosDescriptor } from "../../families/aptos/descriptor";
import { descriptor as bitcoinDescriptor } from "../../families/bitcoin/descriptor";
import { descriptor as cantonDescriptor } from "../../families/canton/descriptor";
import { descriptor as cardanoDescriptor } from "../../families/cardano/descriptor";
import { descriptor as casperDescriptor } from "../../families/casper/descriptor";
import { descriptor as celoDescriptor } from "../../families/celo/descriptor";
import { descriptor as cosmosDescriptor } from "../../families/cosmos/descriptor";
import { descriptor as evmDescriptor } from "../../families/evm/descriptor";
import { descriptor as filecoinDescriptor } from "../../families/filecoin/descriptor";
import { descriptor as hederaDescriptor } from "../../families/hedera/descriptor";
import { descriptor as iconDescriptor } from "../../families/icon/descriptor";
import { descriptor as internetComputerDescriptor } from "../../families/internet_computer/descriptor";
import { descriptor as kaspaDescriptor } from "../../families/kaspa/descriptor";
import { descriptor as minaDescriptor } from "../../families/mina/descriptor";
import { descriptor as multiversxDescriptor } from "../../families/multiversx/descriptor";
import { descriptor as nearDescriptor } from "../../families/near/descriptor";
import { descriptor as polkadotDescriptor } from "../../families/polkadot/descriptor";
import { descriptor as solanaDescriptor } from "../../families/solana/descriptor";
import { descriptor as stacksDescriptor } from "../../families/stacks/descriptor";
import { descriptor as stellarDescriptor } from "../../families/stellar/descriptor";
import { descriptor as suiDescriptor } from "../../families/sui/descriptor";
import { descriptor as tezosDescriptor } from "../../families/tezos/descriptor";
import { descriptor as tonDescriptor } from "../../families/ton/descriptor";
import { descriptor as tronDescriptor } from "../../families/tron/descriptor";
import { descriptor as vechainDescriptor } from "../../families/vechain/descriptor";
import { descriptor as xrpDescriptor } from "../../families/xrp/descriptor";
import type { CoinDescriptor, SendDescriptor } from "./types";

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

  // Fallback: use the descriptor registry
  const fullDescriptor = descriptorRegistry[cryptoCurrency.family];
  if (fullDescriptor) {
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
