import { useMemo } from "react";
import { useTokenById } from "@ledgerhq/cryptoassets/hooks";
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
  const { token: usdc, loading: l0 } = useTokenById(ALL_STABLECOIN_IDS[0], { skip });
  const { token: usdt, loading: l1 } = useTokenById(ALL_STABLECOIN_IDS[1], { skip });
  const { token: daiV2, loading: l2 } = useTokenById(ALL_STABLECOIN_IDS[2], { skip });
  const { token: daiV1, loading: l3 } = useTokenById(ALL_STABLECOIN_IDS[3], { skip });
  const { token: tusd, loading: l4 } = useTokenById(ALL_STABLECOIN_IDS[4], { skip });
  const { token: pax, loading: l5 } = useTokenById(ALL_STABLECOIN_IDS[5], { skip });
  const { token: eurs, loading: l6 } = useTokenById(ALL_STABLECOIN_IDS[6], { skip });
  // Tron TRC-20 (index 7)
  const { token: tronToken, loading: l7 } = useTokenById(ALL_STABLECOIN_IDS[7], { skip });
  // Algorand ASA (indices 8–9)
  const { token: algoToken1, loading: l8 } = useTokenById(ALL_STABLECOIN_IDS[8], { skip });
  const { token: algoToken2, loading: l9 } = useTokenById(ALL_STABLECOIN_IDS[9], { skip });

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
