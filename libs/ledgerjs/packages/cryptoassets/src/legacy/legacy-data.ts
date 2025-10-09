// This file contains the legacy token data imports and state management
// All convert functions have been moved to legacy-utils.ts to make it more modular

import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";
import cardanoNativeTokens from "../data/cardanoNative";
import jettonTokens from "../data/ton-jetton";
import { tokens as sepoliaTokens } from "../data/evm/11155111";
import stellarTokens from "../data/stellar";
import hederaTokens from "../data/hedera";
import vechainTokens from "../data/vip180";
import esdttokens from "../data/esdt";
import asatokens from "../data/asa";
import { tokens as polygonTokens } from "../data/evm/137";
import { tokens as sonicTokens } from "../data/evm/146";
import { tokens as coreTokens } from "../data/evm/1116";
import trc10tokens from "../data/trc10";
import trc20tokens from "../data/trc20";
import { tokens as mainnetTokens } from "../data/evm/1";
import { tokens as bnbTokens } from "../data/evm/56";
import { tokens as celoTokens } from "../data/evm/42220";
import filecoinTokens from "../data/filecoin-erc20";
import spltokens from "../data/spl";
import aptCoinTokens from "../data/apt_coin";
import aptFATokens from "../data/apt_fungible_asset";
import suitokens from "../data/sui";
import stacksTokens from "../data/stacks-sip010";
import {
  convertERC20,
  convertAlgorandASATokens,
  convertVechainToken,
  convertTRONTokens,
  convertMultiversXESDTTokens,
  convertCardanoNativeTokens,
  convertStellarTokens,
  convertJettonToken,
  convertSplTokens,
  convertSuiTokens,
  convertAptCoinTokens,
  convertAptFaTokens,
  convertHederaTokens,
  convertStacksSip010Token,
} from "./legacy-utils";

// Export the legacy token data for use by initializeLegacyTokens in legacy-utils.ts
export {
  mainnetTokens,
  sepoliaTokens,
  polygonTokens,
  hederaTokens,
  bnbTokens,
  trc10tokens,
  trc20tokens,
  asatokens,
  esdttokens,
  cardanoNativeTokens,
  stellarTokens,
  vechainTokens,
  jettonTokens,
  filecoinTokens,
  spltokens,
  sonicTokens,
  coreTokens,
  celoTokens,
  suitokens,
  aptCoinTokens,
  aptFATokens,
  stacksTokens,
};

// Function to initialize legacy tokens (using the actual data imports)
export function initializeLegacyTokens(
  addTokens: (tokens: (TokenCurrency | undefined)[]) => void,
): void {
  // Ethereum mainnet tokens
  addTokens(mainnetTokens.map(convertERC20));
  // Ethereum Sepolia testnet tokens
  addTokens(sepoliaTokens.map(convertERC20));
  // Polygon tokens
  addTokens(polygonTokens.map(convertERC20));
  // Hedera tokens
  addTokens(hederaTokens.map(convertHederaTokens));
  // Binance Smart Chain tokens
  addTokens(bnbTokens.map(convertERC20));
  // Tron tokens
  addTokens(trc10tokens.map(convertTRONTokens("trc10")));
  addTokens(trc20tokens.map(convertTRONTokens("trc20")));
  // Algoland tokens
  addTokens(asatokens.map(convertAlgorandASATokens));
  // MultiversX tokens
  addTokens(esdttokens.map(convertMultiversXESDTTokens));
  // Cardano tokens
  addTokens(cardanoNativeTokens.map(convertCardanoNativeTokens));
  // Stellar tokens
  addTokens(stellarTokens.map(convertStellarTokens));
  // VeChain tokens
  addTokens(vechainTokens.map(convertVechainToken));
  // Ton tokens
  addTokens(jettonTokens.map(convertJettonToken));
  // Filecoin tokens
  addTokens(filecoinTokens.map(convertERC20));
  // Solana tokens
  addTokens(spltokens.map(convertSplTokens));
  // Sonic
  addTokens(sonicTokens.map(convertERC20));
  // Core
  addTokens(coreTokens.map(convertERC20));
  // Celo
  addTokens(celoTokens.map(convertERC20));
  // Stacks
  addTokens(stacksTokens.map(convertStacksSip010Token));

  if (getEnv("SUI_ENABLE_TOKENS")) {
    // Sui tokens
    addTokens(suitokens.map(convertSuiTokens));
  }

  if (getEnv("APTOS_ENABLE_TOKENS")) {
    // Aptos Legacy Coin tokens
    // Aptos fungible assets tokens
    addTokens(aptCoinTokens.map(convertAptCoinTokens));
    addTokens(aptFATokens.map(convertAptFaTokens));
  }
}
