import { AxiosError } from "axios";
import { log } from "@ledgerhq/logs";
import { addTokens, convertERC20 } from "@ledgerhq/cryptoassets/tokens";
import {
  tokens as tokensByChainId,
  hashes as embeddedHashesByChainId,
} from "@ledgerhq/cryptoassets/data/evm/index";
import { ERC20Token } from "@ledgerhq/cryptoassets/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { fetchTokensFromCALService } from "@ledgerhq/cryptoassets/crypto-assets-importer/fetch/index";
import { getCALHash, setCALHash } from "./logic";

export const fetchERC20Tokens: (
  currency: CryptoCurrency,
) => Promise<ERC20Token[] | null> = async currency => {
  const { ethereumLikeInfo } = currency;
  const { chainId } = ethereumLikeInfo || {};

  if (!chainId) return null;

  const embeddedHash = embeddedHashesByChainId[chainId as keyof typeof embeddedHashesByChainId];
  const latestCALHash = getCALHash(currency);
  try {
    const { tokens, hash } = await fetchTokensFromCALService(
      {
        chainId: chainId,
        standard: chainId === 56 ? "bep20" : "erc20",
      },
      [
        "blockchain_name",
        "id",
        "ticker",
        "decimals",
        "name",
        "live_signature",
        "contract_address",
        "delisted",
      ],
      latestCALHash || embeddedHash,
    );
    setCALHash(currency, hash || "");

    return tokens.map(token => {
      // This shouldn't be necessary, we should consumme the ID directly
      // but for now, I'll keep this to maintain a compatibility layer
      // with the content of the CDN (which should be removed soon)
      const [, , tokenIdentifier] = token.id.split("/");

      return [
        token.blockchain_name.toLowerCase(),
        tokenIdentifier,
        token.ticker.toUpperCase(),
        token.decimals,
        token.name,
        token.live_signature,
        token.contract_address,
        false,
        token.delisted,
      ];
    });
  } catch (e) {
    if (e instanceof AxiosError && e.response?.status === 304) {
      log(
        "evm/preload",
        `laoding existing fallback tokens for ${chainId} with hash ${latestCALHash || embeddedHash}`,
      );
      if (!latestCALHash) {
        const embeddedTokens = tokensByChainId[chainId as keyof typeof tokensByChainId];
        setCALHash(currency, embeddedHash);
        return embeddedTokens;
      }
      return null;
    }

    log("evm/preload", `failure to retrieve tokens for ${chainId}`, e);
    return null;
  }
};

export async function preload(currency: CryptoCurrency): Promise<ERC20Token[] | undefined> {
  const erc20 = await fetchERC20Tokens(currency);
  if (!erc20) return;

  log("evm/preload", "preload " + erc20.length + " tokens");
  addTokens(erc20.map(convertERC20));
  return erc20;
}

export function hydrate(value: ERC20Token[] | null | undefined, currency: CryptoCurrency): void {
  if (!value) {
    const { chainId } = currency.ethereumLikeInfo || {};
    const tokens = tokensByChainId[chainId as keyof typeof tokensByChainId] || [];
    addTokens(tokens.map(convertERC20));
    log("evm/preload", `hydrate fallback ${tokens.length} embedded tokens`);
    return;
  }

  addTokens(value.map(convertERC20));
  log("evm/preload", `hydrate ${value.length} tokens`);
  return;
}
