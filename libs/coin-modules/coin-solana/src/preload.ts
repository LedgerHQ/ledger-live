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

export const PRELOAD_MAX_AGE = 15 * 60 * 1000; // 15min

export const fetchSPLTokens: (
  currency: CryptoCurrency,
) => Promise<SPLToken[] | null> = async currency => {
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
    addTokens(splTokens.map(convertSplTokens));
    return splTokens;
  } catch (e) {
    if (e instanceof AxiosError && e.response?.status === 304) {
      log(
        "solana/preload",
        `loading existing fallback tokens for solana with hash ${latestCALHash || embeddedHash}`,
      );
      if (!latestCALHash) {
        setCALHash(currency, embeddedHash);
        addTokens(spltokensList.map(convertSplTokens));
        return spltokensList;
      }
      return null;
    }

    log("solana/preload", `failure to retrieve tokens for solana`, e);
    return null;
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
  if (data == null || data.version == null) {
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
    addTokens(data.splTokens.map(convertSplTokens));
    log("solana/preload", `hydrate ${data.splTokens.length} tokens`);
    setPreloadData(data, currency);
    return;
  }

  addTokens(spltokensList.map(convertSplTokens));
  log("solana/preload", `hydrate fallback ${spltokensList.length} embedded tokens`);
  setPreloadData(data, currency);
}
