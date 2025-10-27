import { Observable, Subject } from "rxjs";
import { log } from "@ledgerhq/logs";
import type { SuiPreloadData, SuiToken } from "../types";
import { getValidators } from "../network/sdk";
import suiTokens, { hash } from "@ledgerhq/cryptoassets/data/sui";
import { fetchTokensFromCALService } from "@ledgerhq/cryptoassets/crypto-assets-importer/fetch/index";
import { addTokens, convertSuiTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import { AxiosError } from "axios";

const PRELOAD_MAX_AGE = 30 * 60 * 1000; // 30 minutes

let currentPreloadedData: SuiPreloadData = { validators: [], tokens: [] };

let latestCALHash = "";

export const fetchSuiTokens: () => Promise<SuiToken[]> = async () => {
  const embeddedHash = hash;

  try {
    const { tokens, hash } = await fetchTokensFromCALService(
      {
        blockchain_name: "sui",
      },
      ["id", "name", "ticker", "contract_address", "decimals", "live_signature"],
      latestCALHash || embeddedHash,
    );

    latestCALHash = hash || "";

    return tokens.map(token => {
      return [
        token.id,
        token.name,
        token.ticker.toUpperCase(),
        token.contract_address,
        token.decimals,
        token.live_signature,
      ];
    });
  } catch (e) {
    if (e instanceof AxiosError && e.response?.status === 304) {
      log(
        "sui/preload",
        `loading existing fallback tokens for sui with hash ${latestCALHash || embeddedHash}`,
      );

      if (!latestCALHash) {
        latestCALHash = embeddedHash;
        return suiTokens;
      }

      return [];
    }

    log("sui/preload", "failure to retrieve tokens for sui", e);
    return [];
  }
};

function fromHydratePreloadData(data: SuiPreloadData): SuiPreloadData {
  return { validators: data?.validators ?? [], tokens: data?.tokens ?? [] };
}

const updates = new Subject<SuiPreloadData>();

export function getCurrentSuiPreloadData(): SuiPreloadData {
  return currentPreloadedData;
}

export function setSuiPreloadData(data: SuiPreloadData) {
  if (data === currentPreloadedData) return;

  currentPreloadedData = data;

  updates.next(data);
}

export function getSuiPreloadDataUpdates(): Observable<SuiPreloadData> {
  return updates.asObservable();
}

export const getPreloadStrategy = () => ({
  preloadMaxAge: PRELOAD_MAX_AGE,
});

let shouldSkipTokenLoading = false;
export function setShouldSkipTokenLoading(skip: boolean): void {
  shouldSkipTokenLoading = skip;
}

export const preload = async (): Promise<SuiPreloadData> => {
  log("sui/preload", "preloading sui data...");

  const validators = await getValidators();

  let tokens: SuiToken[] = [];
  if (!shouldSkipTokenLoading) {
    tokens = await fetchSuiTokens();
    log("sui/preload", "preload " + tokens.length + " tokens");
    addTokens(tokens.map(convertSuiTokens));
  }

  return { validators, tokens };
};

export const hydrate = (data: SuiPreloadData) => {
  const hydrated = fromHydratePreloadData(data);

  setSuiPreloadData(hydrated);
};
