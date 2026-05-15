import { useMemo } from "react";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";

export type EvmNetwork = {
  /** CryptoCurrency id, e.g. "ethereum", "polygon". Stable across the wallet. */
  id: string;
  /** Display name from the cryptoassets catalog, e.g. "Ethereum". */
  name: string;
  /** EIP-155 chain id, used for DMK registrations. */
  chainId: number;
};

/**
 * Top 8 EVM networks, ordered popularity-descending. The order doubles as the
 * dropdown ordering and the default-selection rank — Ethereum is first.
 */
const POPULARITY_ORDER: ReadonlyArray<number> = [
  1, //     Ethereum
  56, //    BNB Smart Chain
  137, //   Polygon
  42161, // Arbitrum One
  10, //    Optimism
  8453, //  Base
  43114, // Avalanche C-Chain
  59144, // Linea
];

export const useEvmNetworks = (): EvmNetwork[] =>
  useMemo(() => {
    const byChainId = new Map<number, EvmNetwork>();
    for (const c of listSupportedCurrencies()) {
      const chainId = c.ethereumLikeInfo?.chainId;
      if (c.family !== "evm" || typeof chainId !== "number") continue;
      if (!POPULARITY_ORDER.includes(chainId)) continue;
      byChainId.set(chainId, { id: c.id, name: c.name, chainId });
    }
    // Preserve the curated order regardless of catalog ordering.
    return POPULARITY_ORDER.map(id => byChainId.get(id)).filter(
      (n): n is EvmNetwork => n !== undefined,
    );
  }, []);
