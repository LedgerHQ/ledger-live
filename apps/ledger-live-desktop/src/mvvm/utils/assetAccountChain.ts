import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

/** Detail pages kept in history while hopping between Asset Detail and Account Detail. */
export const ASSET_ACCOUNT_CHAIN_MAX_DEPTH = 3;

export const ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY = "assetAccountChainDepth";

export const ASSET_ACCOUNT_CHAIN_BELOW_STATE_KEY = "assetAccountChainBelow";

function decodeAssetId(assetId: string): string {
  try {
    return decodeURIComponent(assetId).toLowerCase();
  } catch {
    return assetId.toLowerCase();
  }
}

/** Identifies an asset page whatever the encoding of its route. */
export function assetChainPageKey(assetId: string): string {
  return `asset:${decodeAssetId(assetId)}`;
}

/** Identifies an account page: a token account shows its main account. */
export function accountChainPageKey(mainAccountId: string): string {
  return `account:${mainAccountId}`;
}

function readStateValue(locationState: unknown, key: string): unknown {
  if (!locationState || typeof locationState !== "object") return undefined;
  return (locationState as Record<string, unknown>)[key];
}

/** Position of the current page in the Asset ↔ Account chain; a page opened from elsewhere is the first. */
export function readAssetAccountChainDepth(locationState: unknown): number {
  const raw = readStateValue(locationState, ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY);
  return typeof raw === "number" && Number.isInteger(raw) && raw >= 1 ? raw : 1;
}

function readPageBelow(locationState: unknown): string | undefined {
  const raw = readStateValue(locationState, ASSET_ACCOUNT_CHAIN_BELOW_STATE_KEY);
  return typeof raw === "string" ? raw : undefined;
}

export type AssetAccountChainHop = Readonly<{
  /** Page key of the current page, from {@link assetChainPageKey} or {@link accountChainPageKey}. */
  from: string;
  /** Page key of the page `path` shows. */
  to: string;
  state?: Readonly<Record<string, unknown>>;
}>;

/**
 * Opens the next Asset or Account Detail page. Once the chain holds
 * {@link ASSET_ACCOUNT_CHAIN_MAX_DEPTH} pages, the current page is replaced,
 * or left with Back when the target is the page right below, so Back always
 * reaches the entry point within that many steps and never shows the same page twice.
 */
export function useAssetAccountChainNavigate(): (path: string, hop: AssetAccountChainHop) => void {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();

  return useCallback(
    (path, { from, to, state }) => {
      const depth = readAssetAccountChainDepth(locationState);
      if (depth < ASSET_ACCOUNT_CHAIN_MAX_DEPTH) {
        navigate(path, {
          state: {
            ...state,
            [ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY]: depth + 1,
            [ASSET_ACCOUNT_CHAIN_BELOW_STATE_KEY]: from,
          },
        });
        return;
      }
      const pageBelow = readPageBelow(locationState);
      if (pageBelow === to) {
        navigate(-1);
        return;
      }
      navigate(path, {
        replace: true,
        state: {
          ...state,
          [ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY]: depth,
          [ASSET_ACCOUNT_CHAIN_BELOW_STATE_KEY]: pageBelow,
        },
      });
    },
    [locationState, navigate],
  );
}
