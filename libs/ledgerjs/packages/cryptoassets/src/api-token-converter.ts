import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  convertERC20,
  convertSplTokens,
  convertJettonToken,
  convertAlgorandASATokens,
  convertVechainToken,
  convertTRONTokens,
  convertMultiversXESDTTokens,
  convertCardanoNativeTokens,
  convertStellarTokens,
  convertSuiTokens,
  convertAptCoinTokens,
  convertAptFaTokens,
} from "./tokens";
import {
  AlgorandASAToken,
  CardanoNativeToken,
  ERC20Token,
  MultiversXESDTToken,
  StellarToken,
  TRC10Token,
  TRC20Token,
} from "./types";
import { AptosToken } from "./data/apt_coin";
import type { AptosToken as AptosFAToken } from "./data/apt_fungible_asset";
import { SuiToken } from "./data/sui";
import { Vip180Token } from "./data/vip180";
import { TonJettonToken } from "./data/ton-jetton";
import { SPLToken } from "./data/spl";

export interface ApiTokenData {
  id: string;
  contractAddress: string;
  name: string;
  ticker: string;
  units: Array<{ code: string; name: string; magnitude: number }>;
  standard: string;
  delisted?: boolean;
  disableCountervalue?: boolean;
  tokenIdentifier?: string;
}

export function convertApiToken(apiToken: ApiTokenData): TokenCurrency | undefined {
  const { standard, id, contractAddress, name, ticker, units, delisted = false } = apiToken;

  const magnitude = units[0]?.magnitude || 0;

  switch (standard) {
    case "erc20":
    case "bep20": {
      const parentCurrencyId = id.split("/")[0];
      const tokenIdentifier = id.split("/")[2] || contractAddress;
      const erc20Data: ERC20Token = [
        parentCurrencyId,
        tokenIdentifier,
        ticker,
        magnitude,
        name,
        "",
        contractAddress,
        false,
        delisted,
      ];
      return convertERC20(erc20Data);
    }
    case "spl": {
      const parentCurrencyId = id.split("/")[0];
      const splData: SPLToken = [id, parentCurrencyId, name, ticker, contractAddress, magnitude];
      return convertSplTokens(splData);
    }
    case "jetton": {
      const jettonData: TonJettonToken = [contractAddress, name, ticker, magnitude, delisted];
      return convertJettonToken(jettonData);
    }
    case "asa": {
      const tokenId = id.split("/")[2] || contractAddress;
      const asaData: AlgorandASAToken = [tokenId, ticker, name, contractAddress, magnitude];
      return convertAlgorandASATokens(asaData);
    }
    case "esdt": {
      const tokenIdentifier = id.split("/")[2] || contractAddress;
      const esdtData: MultiversXESDTToken = [ticker, tokenIdentifier, magnitude, "", name];
      return convertMultiversXESDTTokens(esdtData);
    }
    case "trc10": {
      const tokenId = parseInt(id.split("/")[2] || contractAddress);
      const trc10Data: TRC10Token = [
        tokenId,
        ticker,
        name,
        contractAddress,
        magnitude,
        delisted,
        "",
      ];
      return convertTRONTokens("trc10")(trc10Data);
    }
    case "trc20": {
      const tokenId = id.split("/")[2] || contractAddress;
      const trc20Data: TRC20Token = [
        tokenId,
        ticker,
        name,
        contractAddress,
        magnitude,
        delisted,
        "",
      ];
      return convertTRONTokens("trc20")(trc20Data);
    }
    case "vip180": {
      const tokenIdentifier = id.split("/")[2] || contractAddress;
      const vip180Data: Vip180Token = [tokenIdentifier, ticker, name, contractAddress, magnitude];
      return convertVechainToken(vip180Data);
    }
    case "native": {
      const parentCurrencyId = id.split("/")[0];
      if (parentCurrencyId !== "cardano") return undefined;

      const tokenIdentifier = id.split("/")[2] || contractAddress;
      const parts = tokenIdentifier.split(".");
      const [policyId, assetName = ""] = parts;

      const cardanoData: CardanoNativeToken = [
        "cardano",
        policyId,
        assetName,
        name,
        ticker,
        magnitude,
        delisted,
      ];
      return convertCardanoNativeTokens(cardanoData);
    }
    case "stellar": {
      const parts = contractAddress.split(":");
      const assetCode = parts[0] || ticker;
      const assetIssuer = parts[1] || contractAddress;

      const stellarData: StellarToken = [assetCode, assetIssuer, "stellar", name, magnitude];
      return convertStellarTokens(stellarData);
    }
    case "coin": {
      const aptCoinData: AptosToken = [id, ticker, name, contractAddress, magnitude, delisted];
      return convertAptCoinTokens(aptCoinData);
    }
    case "fungible_asset": {
      const aptFaData: AptosFAToken = [id, ticker, name, contractAddress, magnitude, delisted];
      return convertAptFaTokens(aptFaData);
    }
    case "sui": {
      const suiData: SuiToken = [id, name, ticker, contractAddress, magnitude];
      return convertSuiTokens(suiData);
    }
    default:
      return undefined;
  }
}
