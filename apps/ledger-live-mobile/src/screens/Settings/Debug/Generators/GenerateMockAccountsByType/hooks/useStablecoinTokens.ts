import { useMemo } from "react";
import { useTokenById } from "@features/platform-currencies";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ALL_STABLECOIN_IDS } from "../constants";

export interface StablecoinTokensResult {
  ethereumTokens: TokenCurrency[];
  tronTokens: TokenCurrency[];
  algorandTokens: TokenCurrency[];
  loading: boolean;
}

/**
 * Fetches all 10 stablecoin tokens from the CAL (one hook call per token).
 * Returns tokens grouped by parent network, ready to be passed as tokensData
 * to genAccount. Pass `enabled = false` to skip all network requests when
 * stablecoins are not selected.
 */
export function useStablecoinTokens(enabled = true): StablecoinTokensResult {
  const skip = !enabled;
  // Ethereum ERC-20 stablecoins (indices 0–6)
  const { data: usdc, isLoading: l0 } = useTokenById(skip ? undefined : ALL_STABLECOIN_IDS[0]);
  const { data: usdt, isLoading: l1 } = useTokenById(skip ? undefined : ALL_STABLECOIN_IDS[1]);
  const { data: daiV2, isLoading: l2 } = useTokenById(skip ? undefined : ALL_STABLECOIN_IDS[2]);
  const { data: daiV1, isLoading: l3 } = useTokenById(skip ? undefined : ALL_STABLECOIN_IDS[3]);
  const { data: tusd, isLoading: l4 } = useTokenById(skip ? undefined : ALL_STABLECOIN_IDS[4]);
  const { data: pax, isLoading: l5 } = useTokenById(skip ? undefined : ALL_STABLECOIN_IDS[5]);
  const { data: eurs, isLoading: l6 } = useTokenById(skip ? undefined : ALL_STABLECOIN_IDS[6]);
  // Tron TRC-20 (index 7)
  const { data: tronToken, isLoading: l7 } = useTokenById(skip ? undefined : ALL_STABLECOIN_IDS[7]);
  // Algorand ASA (indices 8–9)
  const { data: algoToken1, isLoading: l8 } = useTokenById(
    skip ? undefined : ALL_STABLECOIN_IDS[8],
  );
  const { data: algoToken2, isLoading: l9 } = useTokenById(
    skip ? undefined : ALL_STABLECOIN_IDS[9],
  );

  const loading = enabled && (l0 || l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9);

  const ethereumTokens = useMemo(
    () =>
      [usdc, usdt, daiV2, daiV1, tusd, pax, eurs].filter(
        (t): t is TokenCurrency => t !== undefined,
      ),
    [daiV1, daiV2, eurs, pax, tusd, usdc, usdt],
  );

  const tronTokens = useMemo(
    () => [tronToken].filter((t): t is TokenCurrency => t !== undefined),
    [tronToken],
  );

  const algorandTokens = useMemo(
    () => [algoToken1, algoToken2].filter((t): t is TokenCurrency => t !== undefined),
    [algoToken1, algoToken2],
  );

  return { ethereumTokens, tronTokens, algorandTokens, loading };
}
