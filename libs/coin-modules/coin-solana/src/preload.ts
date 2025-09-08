import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { flow } from "lodash/fp";
import { ChainAPI } from "./network";
import { log } from "@ledgerhq/logs";
import { setSolanaPreloadData as setPreloadData } from "./preload-data";
import { SolanaPreloadData, SolanaPreloadDataV1 } from "./types";
import {
  assertUnreachable,
  clusterByCurrencyId,
  profitableValidators,
  ledgerFirstValidators,
} from "./utils";
import { getValidators, ValidatorsAppValidator } from "./network/validator-app";
import spltokensList, { hash as embeddedHash, SPLToken } from "@ledgerhq/cryptoassets/data/spl";
import { fetchTokensFromCALService } from "@ledgerhq/cryptoassets/crypto-assets-importer/fetch/index";
import { getCALHash, setCALHash } from "./logic";
import { addTokens, convertSplTokens } from "@ledgerhq/cryptoassets/tokens";
import { AxiosError } from "axios";
import { getCryptoAssetsStore } from "./cryptoAssetsStore";
import { resolveTokenAdder } from "@ledgerhq/coin-framework/crypto-assets/utils";
import coinConfig from "./config";

const storeTokens = (tokens: SPLToken[]) => {
  const addTokensToStore = resolveTokenAdder(getCryptoAssetsStore);
  if (addTokensToStore) {
    const convertedTokens = tokens.map(convertSplTokens);
    addTokensToStore(convertedTokens);
  } else {
    addTokens(tokens.map(convertSplTokens));
  }
};

export const PRELOAD_MAX_AGE = 15 * 60 * 1000; // 15min

const isLazyLoadingEnabled = (): boolean => {
  try {
    return coinConfig.getCoinConfig().calLazyLoading ?? false;
  } catch (e) {
    console.error("[SOLANA] Error getting coin config: ", e);
    return false;
  }
};

export const fetchSPLTokens: (
  currency: CryptoCurrency,
) => Promise<SPLToken[] | null> = async currency => {
  // If lazy loading is NOT enabled, stay in legacy and avoid CAL service.
  if (!isLazyLoadingEnabled()) {
    storeTokens(spltokensList);
    return spltokensList;
  }

  const latestCALHash = getCALHash(currency);
  const calHash = latestCALHash || embeddedHash;

  try {
    const { tokens, hash } = await fetchTokensFromCALService(
      { blockchain_name: "solana" },
      ["id", "network", "name", "ticker", "contract_address", "decimals"],
      calHash,
    );

    const splTokens: SPLToken[] = tokens.map(token => [
      token.id,
      token.network,
      token.name,
      token.ticker,
      token.contract_address,
      token.decimals,
    ]);

    setCALHash(currency, hash || "");
    log("solana/preload", "preload " + splTokens.length + " tokens");
    storeTokens(splTokens);

    return splTokens;
  } catch (e) {
    if (e instanceof AxiosError && e.response?.status === 304) {
      if (!latestCALHash) {
        setCALHash(currency, embeddedHash);
      }
    }

    storeTokens(spltokensList);
    return spltokensList;
  }
};
export async function preloadWithAPI(
  currency: CryptoCurrency,
  getAPI: () => Promise<ChainAPI>,
): Promise<SolanaPreloadDataV1> {
  const api = await getAPI();

  const cluster = clusterByCurrencyId(currency.id);

  const validators: ValidatorsAppValidator[] =
    cluster === "devnet" ? await loadDevnetValidators(api) : await getValidators(cluster);

  const splTokens = await fetchSPLTokens(currency);

  const data: SolanaPreloadData = {
    version: "1",
    validatorsWithMeta: [],
    validators: cluster === "mainnet-beta" ? preprocessMainnetValidators(validators) : validators,
    splTokens,
  };

  setPreloadData(data, currency);

  return data;
}

function preprocessMainnetValidators(
  validators: ValidatorsAppValidator[],
): ValidatorsAppValidator[] {
  return flow(() => validators, profitableValidators, ledgerFirstValidators)();
}

async function loadDevnetValidators(api: ChainAPI) {
  const voteAccs = await api.getVoteAccounts();
  const validators: ValidatorsAppValidator[] = voteAccs.current.map(acc => ({
    activeStake: acc.activatedStake,
    commission: acc.commission,
    totalScore: 0,
    voteAccount: acc.votePubkey,
  }));
  return validators;
}

export function hydrate(data: SolanaPreloadData | undefined, currency: CryptoCurrency): void {
  // https://ledgerhq.atlassian.net/browse/LIVE-11568 covers unknown case where version is undefined
  if (!data || !data.version) {
    return;
  }

  switch (data.version) {
    case "1":
      hydrateV1(data, currency);
      return;
    case "2":
      throw new Error("version 2 for now exists only to support discriminated union");
    default:
      return assertUnreachable(data);
  }
}

function hydrateV1(data: SolanaPreloadDataV1, currency: CryptoCurrency) {
  if (Array.isArray(data.splTokens)) {
    storeTokens(data.splTokens);
    log("solana/preload", `hydrate ${data.splTokens.length} tokens`);
    setPreloadData(data, currency);
    return;
  }

  storeTokens(spltokensList);
  log("solana/preload", `hydrate fallback ${spltokensList.length} embedded tokens`);
  setPreloadData(data, currency);
}
