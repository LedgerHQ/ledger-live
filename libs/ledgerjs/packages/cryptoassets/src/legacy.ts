import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import cardanoNativeTokens, { CardanoNativeToken } from "./data/cardanoNative";
import { findCryptoCurrencyById, getCryptoCurrencyById } from "./currencies";
import jettonTokens, { TonJettonToken } from "./data/ton-jetton";
import { tokens as sepoliaTokens } from "./data/evm/11155111";
import stellarTokens, { StellarToken } from "./data/stellar";
import hederaTokens, { HederaToken } from "./data/hedera";
import vechainTokens, { Vip180Token } from "./data/vip180";
import esdttokens, { MultiversXESDTToken } from "./data/esdt";
import asatokens, { AlgorandASAToken } from "./data/asa";
import { tokens as polygonTokens } from "./data/evm/137";
import { tokens as sonicTokens } from "./data/evm/146";
import trc10tokens, { TRC10Token } from "./data/trc10";
import trc20tokens, { TRC20Token } from "./data/trc20";
import { tokens as mainnetTokens } from "./data/evm/1";
import { tokens as bnbTokens } from "./data/evm/56";
import { tokens as celoTokens } from "./data/evm/42220";
import filecoinTokens from "./data/filecoin-erc20";
import spltokens, { SPLToken } from "./data/spl";
import aptCoinTokens, { AptosToken as AptosCoinToken } from "./data/apt_coin";
import aptFATokens, { AptosToken as AptosFAToken } from "./data/apt_fungible_asset";
import suitokens, { SuiToken } from "./data/sui";
import { ERC20Token } from "./types";
import { getEnv } from "@ledgerhq/live-env";

// Convert functions - moved from tokens.ts

export function convertERC20([
  parentCurrencyId,
  token,
  ticker,
  magnitude,
  name,
  ledgerSignature,
  contractAddress,
  disableCountervalue,
  delisted,
]: ERC20Token): TokenCurrency | undefined {
  const parentCurrency = findCryptoCurrencyById(parentCurrencyId);

  if (!parentCurrency) {
    return;
  }

  const tokenType = parentCurrencyId === "bsc" ? "bep20" : "erc20";

  return {
    type: "TokenCurrency",
    id: `${parentCurrencyId}/${tokenType}/${token}`,
    ledgerSignature,
    contractAddress,
    parentCurrency,
    tokenType,
    name,
    ticker,
    delisted,
    disableCountervalue: !!parentCurrency.isTestnetFor || !!disableCountervalue,
    units: [
      {
        name,
        code: ticker,
        magnitude,
      },
    ],
  };
}

export function convertAlgorandASATokens([
  id,
  abbr,
  name,
  contractAddress,
  precision,
]: AlgorandASAToken): TokenCurrency {
  const parentCurrency = getCryptoCurrencyById("algorand");

  return {
    type: "TokenCurrency",
    id: `algorand/asa/${id}`,
    contractAddress,
    parentCurrency,
    tokenType: "asa",
    name,
    ticker: abbr,
    disableCountervalue: false,
    units: [
      {
        name,
        code: abbr,
        magnitude: precision,
      },
    ],
  };
}

export function convertVechainToken([
  tokenIdenfitier,
  ticker,
  name,
  contractAddress,
  precision,
]: Vip180Token): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: `vechain/vip180/${tokenIdenfitier}`,
    contractAddress: contractAddress,
    parentCurrency: getCryptoCurrencyById("vechain"),
    tokenType: "vip180",
    name,
    ticker,
    disableCountervalue: false,
    units: [
      {
        name,
        code: ticker,
        magnitude: precision,
      },
    ],
  };
}

export function convertTRONTokens(type: "trc10" | "trc20") {
  return ([id, abbr, name, contractAddress, precision, delisted, ledgerSignature]:
    | TRC10Token
    | TRC20Token): TokenCurrency => {
    const parentCurrency = getCryptoCurrencyById("tron");

    return {
      type: "TokenCurrency",
      id: `tron/${type}/${id}`,
      contractAddress,
      parentCurrency,
      tokenType: type,
      name,
      ticker: abbr,
      delisted,
      disableCountervalue: false,
      ledgerSignature,
      units: [
        {
          name,
          code: abbr,
          magnitude: precision,
        },
      ],
    };
  };
}

export function convertMultiversXESDTTokens([
  ticker,
  identifier,
  decimals,
  signature,
  name,
]: MultiversXESDTToken): TokenCurrency {
  const MULTIVERSX_ESDT_CONTRACT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u";
  // const parentCurrency = getCryptoCurrencyById("multiversx");
  const parentCurrency = getCryptoCurrencyById("elrond");

  return {
    type: "TokenCurrency",
    id: `multiversx/esdt/${identifier}`,
    contractAddress: MULTIVERSX_ESDT_CONTRACT,
    ledgerSignature: signature,
    parentCurrency,
    tokenType: "esdt",
    disableCountervalue: false,
    name,
    ticker,
    units: [
      {
        name,
        code: name,
        magnitude: decimals,
      },
    ],
  };
}

export function convertSplTokens([
  id,
  network,
  name,
  symbol,
  address,
  decimals,
]: SPLToken): TokenCurrency {
  return {
    type: "TokenCurrency",
    id,
    contractAddress: address,
    parentCurrency: getCryptoCurrencyById(network),
    name,
    tokenType: "spl",
    ticker: symbol,
    disableCountervalue: false,
    units: [
      {
        name,
        code: symbol,
        magnitude: decimals,
      },
    ],
  };
}

function convertAptosTokens(
  tokenType: "coin" | "fungible_asset",
  [id, ticker, name, address, decimals, delisted]: AptosCoinToken | AptosFAToken,
): TokenCurrency {
  return {
    type: "TokenCurrency",
    id,
    contractAddress: address,
    parentCurrency: getCryptoCurrencyById("aptos"),
    name,
    tokenType,
    ticker,
    disableCountervalue: false,
    delisted,
    units: [
      {
        name,
        code: ticker,
        magnitude: decimals,
      },
    ],
  };
}

export function convertAptCoinTokens(token: AptosCoinToken): TokenCurrency {
  return convertAptosTokens("coin", token);
}

export function convertAptFaTokens(token: AptosFAToken): TokenCurrency {
  return convertAptosTokens("fungible_asset", token);
}

export function convertSuiTokens([id, name, ticker, address, decimals]: SuiToken): TokenCurrency {
  return {
    type: "TokenCurrency",
    id,
    contractAddress: address,
    parentCurrency: getCryptoCurrencyById("sui"),
    name,
    tokenType: "sui",
    ticker,
    disableCountervalue: false,
    units: [
      {
        name,
        code: ticker,
        magnitude: decimals,
      },
    ],
  };
}

function convertHederaTokens([
  id,
  tokenId,
  name,
  ticker,
  network,
  decimals,
  delisted,
]: HederaToken): TokenCurrency {
  return {
    type: "TokenCurrency",
    id,
    contractAddress: tokenId,
    parentCurrency: getCryptoCurrencyById(network),
    tokenType: "hts",
    name,
    ticker,
    delisted,
    disableCountervalue: false,
    units: [
      {
        name,
        code: ticker,
        magnitude: decimals,
      },
    ],
  };
}

export function convertCardanoNativeTokens([
  parentCurrencyId,
  policyId,
  assetName,
  name,
  ticker,
  decimals,
  delisted,
]: CardanoNativeToken): TokenCurrency | undefined {
  const assetId = policyId + assetName;

  const parentCurrency = getCryptoCurrencyById(parentCurrencyId);

  if (!parentCurrency) {
    return;
  }

  return {
    type: "TokenCurrency",
    id: `${parentCurrencyId}/native/${assetId}`,
    // Tracking and accounting of native tokens is natively supported by cardano ledger.
    // As there's no contract for native tokens, using unique assetId in place of contractAddress
    contractAddress: assetId,
    parentCurrency,
    tokenType: "native",
    name,
    ticker,
    delisted,
    disableCountervalue: false,
    units: [
      {
        name,
        code: ticker,
        magnitude: decimals,
      },
    ],
  };
}

export function convertStellarTokens([
  assetCode,
  assetIssuer,
  assetType,
  name,
  precision,
]: StellarToken): TokenCurrency {
  const parentCurrency = getCryptoCurrencyById("stellar");

  // FIXME: to be discussed with CAL service as values are Uppercase IRL
  return {
    type: "TokenCurrency",
    id: `stellar/asset/${assetCode.toUpperCase()}:${assetIssuer.toUpperCase()}`,
    contractAddress: assetIssuer.toUpperCase(),
    parentCurrency,
    tokenType: assetType,
    name,
    ticker: assetCode,
    disableCountervalue: false,
    units: [
      {
        name,
        code: assetCode,
        magnitude: precision,
      },
    ],
  };
}

export function convertJettonToken([address, name, ticker, magnitude, delisted]: TonJettonToken):
  | TokenCurrency
  | undefined {
  const parentCurrency = findCryptoCurrencyById("ton");

  if (!parentCurrency) {
    return;
  }

  return {
    type: "TokenCurrency",
    id: "ton/jetton/" + address.toLocaleLowerCase(),
    contractAddress: address,
    parentCurrency,
    tokenType: "jetton",
    name,
    ticker,
    delisted,
    disableCountervalue: false,
    units: [
      {
        name,
        code: ticker,
        magnitude,
      },
    ],
  };
}

// Legacy token initialization
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
  // Celo
  addTokens(celoTokens.map(convertERC20));

  if (getEnv("SUI_ENABLE_TOKENS")) {
    // Sui tokens
    addTokens(suitokens.map(convertSuiTokens));
  }

  if (getEnv("APTOS_ENABLE_TOKENS")) {
    // Aptos Legacy Coin tokens
    addTokens(aptCoinTokens.map(convertAptCoinTokens));
    // Aptos fungible assets tokens
    addTokens(aptFATokens.map(convertAptFaTokens));
  }
}
