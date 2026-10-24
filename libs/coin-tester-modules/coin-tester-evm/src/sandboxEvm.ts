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
   * The request and the read of its body stop at `deadline`: a stalled Atlas must not outlast the wait that asked.
   */
  const get = async (path: string, deadline: number): Promise<AtlasAnswer | undefined> => {
    const signal = AbortSignal.timeout(Math.max(deadline - Date.now(), 1));
    try {
      const response = await fetch(`${uri}/blockchain/v4/${explorerId}${path}`, { signal });
      if (!response.ok) return undefined;
      // Not JSON is "nothing yet", but an abort is not: it rethrows to the catch below
      return await response.json().catch(error => {
        if (signal.aborted) throw error;
        return undefined;
      });
    } catch (error) {
      if (signal.aborted)
        throw new Error(`Atlas did not answer ${path} before the deadline`, { cause: error });
      throw error;
    }
  };

  return {
    /**
     * Waits until Atlas has indexed `block`. The node seals a block every second and Atlas follows a moment later,
     * so a sync that came first would read an account that has not moved yet.
     */
    waitForBlock: async (block: number): Promise<void> => {
      const deadline = Date.now() + TIMEOUT_MS;
      for (;;) {
        const current = await get("/block/current", deadline);
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
        const barometer = await get("/gastracker/barometer?display=eip1559", deadline);
        if (barometer?.medium !== undefined && BigInt(barometer.medium) > 0n) return;
        if (Date.now() > deadline) throw new Error("Atlas's gas tracker still says 0 after 60 s");
        await sleep(250);
      }
    },
  };
}

/**
 * The Blockscout of a chain, which the sandbox starts as its explorer: `uri` is the indexer endpoint of the instance.
 * Live reads it as an etherscan-compatible explorer (`/api`), and its internal transactions block by block.
 */
export function blockscoutOf(uri: string) {
  const get = async (path: string, deadline: number): Promise<unknown> => {
    const signal = AbortSignal.timeout(Math.max(deadline - Date.now(), 1));
    try {
      const response = await fetch(`${uri}${path}`, { signal });
      if (!response.ok) return undefined;
      return await response.json().catch(error => {
        if (signal.aborted) throw error;
        return undefined;
      });
    } catch (error) {
      if (signal.aborted)
        throw new Error(`Blockscout did not answer ${path} before the deadline`, { cause: error });
      throw error;
    }
  };

  return {
    /**
     * Waits until Blockscout has indexed `block` and processed its internal transactions: it answers a block it has
     * not traced yet with `meta.status` 2 (1 once it has), and a sync that read it then would miss them.
     */
    waitForBlock: async (block: number): Promise<void> => {
      const deadline = Date.now() + TIMEOUT_MS;
      while (Date.now() < deadline) {
        const blocks = (await get("/api/v2/blocks", deadline)) as
          | { items?: { height: number }[] }
          | undefined;
        if ((blocks?.items?.[0]?.height ?? -1) >= block) {
          const internal = (await get(
            `/api/v2/blocks/${block}/internal-transactions`,
            deadline,
          )) as { meta?: { status?: number } } | undefined;
          if (internal?.meta?.status === 1) return;
        }
        await sleep(500);
      }
      throw new Error(`Blockscout did not index block ${block} in 60 s`);
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
