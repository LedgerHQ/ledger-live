import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

/** Detail pages kept in history while hopping between Asset Detail and Account Detail. */
export const ASSET_ACCOUNT_CHAIN_MAX_DEPTH = 3;

export const ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY = "assetAccountChainDepth";

/** Position of the current page in the Asset ↔ Account chain; a page opened from elsewhere is the first. */
export function readAssetAccountChainDepth(locationState: unknown): number {
  if (!locationState || typeof locationState !== "object") return 1;
  const raw: unknown = (locationState as Record<string, unknown>)[
    ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY
  ];
  return typeof raw === "number" && Number.isInteger(raw) && raw >= 1 ? raw : 1;
}

/**
 * Opens the next Asset or Account Detail page. Once the chain holds
 * {@link ASSET_ACCOUNT_CHAIN_MAX_DEPTH} pages, the current page is replaced,
 * so Back always reaches the entry point within that many steps.
 */
export function useAssetAccountChainNavigate(): (
  path: string,
  extraState?: Readonly<Record<string, unknown>>,
) => void {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();

  return useCallback(
    (path, extraState) => {
      const depth = readAssetAccountChainDepth(locationState);
      const isChainFull = depth >= ASSET_ACCOUNT_CHAIN_MAX_DEPTH;
      navigate(path, {
        replace: isChainFull,
        state: {
          ...extraState,
          [ASSET_ACCOUNT_CHAIN_DEPTH_STATE_KEY]: isChainFull ? depth : depth + 1,
        },
      });
    },
    [locationState, navigate],
  );
}
