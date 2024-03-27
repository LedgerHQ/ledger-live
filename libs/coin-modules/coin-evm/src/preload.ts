import axios from "axios";
import { log } from "@ledgerhq/logs";
import {
  addTokens,
  convertERC20,
  convertBEP20,
  listTokensForCryptoCurrency,
} from "@ledgerhq/cryptoassets/tokens";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BEP20Token, ERC20Token } from "@ledgerhq/cryptoassets/types";
import {
  tokens as tokensByChainId,
  hashes as embeddedHashesByChainId,
} from "@ledgerhq/cryptoassets/data/evm/index";
import { getCALHash, setCALHash } from "./logic";

export const fetchERC20Tokens: (
  currency: CryptoCurrency,
) => Promise<ERC20Token[] | BEP20Token[] | null> = async currency => {
  const { ethereumLikeInfo } = currency;

  const latestCALHash = getCALHash(currency);
  const embeddedHash =
    embeddedHashesByChainId[ethereumLikeInfo?.chainId as keyof typeof embeddedHashesByChainId];
  const embeddedTokens = tokensByChainId[
    ethereumLikeInfo?.chainId as keyof typeof tokensByChainId
  ] as ERC20Token[];

  const url = `${getEnv("DYNAMIC_CAL_BASE_URL")}/evm/${ethereumLikeInfo?.chainId || 0}/erc20.json`;
  const tokens = await axios
    .get<ERC20Token[]>(url, {
      headers: {
        "If-None-Match": latestCALHash,
      },
    })
    .then(({ data, headers }) => {
      if (data?.length) {
        setCALHash(currency, headers.etag);
        return data;
      }
      return null;
    })
    .catch(e => {
      // Hitting cache and tokens are already set at least once
      // Don't do anything
      if (e.code === "304" && listTokensForCryptoCurrency(currency).length) {
        return null;
      }

      log("error", "EVM Family: Couldn't fetch dynamic CAL tokens from " + url, e);
      setCALHash(currency, embeddedHash);
      return embeddedTokens;
    });

  return tokens;
};

export async function preload(
  currency: CryptoCurrency,
): Promise<ERC20Token[] | BEP20Token[] | undefined> {
  const erc20 = await fetchERC20Tokens(currency);
  if (!erc20) return;

  log("evm/preload", "preload " + erc20.length + " tokens");
  if (currency.id === "bsc") {
    addTokens((erc20 as BEP20Token[]).map(convertBEP20));
    return erc20;
  }
  addTokens(erc20.map(convertERC20));
  return erc20;
}

export function hydrate(value: ERC20Token[] | null | undefined, currency: CryptoCurrency): void {
  if (!Array.isArray(value)) return;
  if (currency.id === "bsc") {
    addTokens((value as BEP20Token[]).map(convertBEP20));
    log("evm/preload", "hydrate " + value.length + " tokens");
    return;
  }
  addTokens(value.map(convertERC20));
  log("evm/preload", "hydrate " + value.length + " tokens");
}
