import { Observable, Subject } from "rxjs";
import { log } from "@ledgerhq/logs";
import type { StacksPreloadData } from "../types";
import stacksTokens, { hash, StacksSip010Token } from "@ledgerhq/cryptoassets/data/stacks-sip010";
import { fetchTokensFromCALService } from "@ledgerhq/cryptoassets/crypto-assets-importer/fetch/index";
import { convertCALContractAddressToStacksSip010 } from "@ledgerhq/cryptoassets/crypto-assets-importer/importers/stacks/index";
import { addTokens, convertStacksSip010Token } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import { AxiosError } from "axios";

const PRELOAD_MAX_AGE = 30 * 60 * 1000; // 30 minutes

let currentPreloadedData: StacksPreloadData = { tokens: [] };

let latestCALHash = "";

export const fetchStacksTokens: () => Promise<StacksSip010Token[]> = async () => {
  const embeddedHash = hash;

  try {
    const { tokens, hash } = await fetchTokensFromCALService(
      {
        blockchain_name: "stacks",
      },
      ["contract_address", "name", "ticker", "decimals", "delisted", "live_signature"],
      latestCALHash || embeddedHash,
    );

    latestCALHash = hash || "";

    return tokens.map(token => {
      // For Stacks, contract_address contains the full identifier: "contractAddress.contractName::assetName"
      // We need to parse this to extract:
      // - The actual contract address
      // - The asset name
      // - The contract display name
      const { actualContractAddress, contractName, assetName } =
        convertCALContractAddressToStacksSip010(token.contract_address || "");

      return [
        actualContractAddress,
        contractName,
        assetName,
        token.name,
        token.ticker.toUpperCase(),
        token.decimals,
        token.delisted,
        token.live_signature,
      ];
    });
  } catch (e) {
    if (e instanceof AxiosError && e.response?.status === 304) {
      log(
        "stacks/preload",
        `loading existing fallback tokens for stacks with hash ${latestCALHash || embeddedHash}`,
      );

      if (!latestCALHash) {
        latestCALHash = embeddedHash;
        return stacksTokens;
      }

      return [];
    }

    log("stacks/preload", "failure to retrieve tokens for stacks", e);
    return [];
  }
};

function fromHydratePreloadData(data: StacksPreloadData): StacksPreloadData {
  return { tokens: data?.tokens ?? [] };
}

const updates = new Subject<StacksPreloadData>();

export function getCurrentStacksPreloadData(): StacksPreloadData {
  return currentPreloadedData;
}

export function setStacksPreloadData(data: StacksPreloadData) {
  if (data === currentPreloadedData) return;

  currentPreloadedData = data;

  updates.next(data);
}

export function getStacksPreloadDataUpdates(): Observable<StacksPreloadData> {
  return updates.asObservable();
}

export const getPreloadStrategy = () => ({
  preloadMaxAge: PRELOAD_MAX_AGE,
});

let shouldSkipTokenLoading = false;
export function setShouldSkipTokenLoading(skip: boolean): void {
  shouldSkipTokenLoading = skip;
}

export const preload = async (): Promise<StacksPreloadData> => {
  log("stacks/preload", "preloading stacks data...");

  let tokens: StacksSip010Token[] = [];
  if (!shouldSkipTokenLoading) {
    tokens = await fetchStacksTokens();
    log("stacks/preload", "preload " + tokens.length + " tokens");
    addTokens(tokens.map(convertStacksSip010Token));
  }

  return { tokens };
};

export const hydrate = (data: StacksPreloadData) => {
  const hydrated = fromHydratePreloadData(data);

  setStacksPreloadData(hydrated);
};
