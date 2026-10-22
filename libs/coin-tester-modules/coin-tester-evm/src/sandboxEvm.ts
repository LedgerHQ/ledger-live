/**
 * What the scenarios that run on coin-sandbox share: Atlas, which the sandbox starts as the explorer and the gas
 * tracker of the chain, and the in-memory token store.
 */
import { setTimeout as sleep } from "node:timers/promises";
import {
  getCryptoAssetsStore,
  setCryptoAssetsStore,
} from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";

type AtlasAnswer = { height?: number; medium?: string };

const TIMEOUT_MS = 60_000;

/** The Atlas of a chain: `uri` is the indexer endpoint of the sandbox instance, `explorerId` the coin of Atlas. */
export function atlasOf(uri: string, explorerId: string) {
  /**
   * What Atlas answers, or nothing yet: its container is healthy before its indexer has stored a block, and the API
   * then answers `Internal server error` (not JSON). The sandbox waits for it too, so this is a second guard.
   */
  const get = async (path: string): Promise<AtlasAnswer | undefined> => {
    const response = await fetch(`${uri}/blockchain/v4/${explorerId}${path}`);
    if (!response.ok) return undefined;
    return response.json().catch(() => undefined);
  };

  return {
    /**
     * Waits until Atlas has indexed `block`. The node seals a block every second and Atlas follows a moment later,
     * so a sync that came first would read an account that has not moved yet.
     */
    waitForBlock: async (block: number): Promise<void> => {
      const deadline = Date.now() + TIMEOUT_MS;
      for (;;) {
        const current = await get("/block/current");
        if (current?.height !== undefined && current.height >= block) return;
        if (Date.now() > deadline) throw new Error(`Atlas did not reach block ${block} in 60 s`);
        await sleep(250);
      }
    },

    /**
     * Waits until Atlas's gas tracker has seen a transaction. It follows the indexed blocks a few seconds late and
     * says a priority fee of 0 until then, which `validateIntent` refuses (`PriorityFeeTooLow`): a transaction
     * prepared in that gap fails, whatever the chain. Once it has seen one, it keeps a non-zero fee.
     */
    waitForGasTracker: async (): Promise<void> => {
      const deadline = Date.now() + TIMEOUT_MS;
      for (;;) {
        const barometer = await get("/gastracker/barometer?display=eip1559");
        if (barometer?.medium !== undefined && BigInt(barometer.medium) > 0n) return;
        if (Date.now() > deadline) throw new Error("Atlas's gas tracker still says 0 after 60 s");
        await sleep(250);
      }
    },
  };
}

/**
 * Swaps the token store for an in-memory one that knows `tokens`, the mainnet tokens the sandbox preloads at their
 * address: no CAL to ask. Returns what puts the store of the other scenarios of the run back.
 */
export function swapTokens(currencyId: string, tokens: TokenCurrency[]): () => void {
  const previous = getCryptoAssetsStore();
  setCryptoAssetsStore({
    findTokenById: async id => tokens.find(token => token.id === id),
    findTokenByAddressInCurrency: async (address, id) =>
      id === currencyId
        ? tokens.find(token => token.contractAddress.toLowerCase() === address.toLowerCase())
        : undefined,
    getTokensSyncHash: async () => "",
  });
  return () => setCryptoAssetsStore(previous);
}
