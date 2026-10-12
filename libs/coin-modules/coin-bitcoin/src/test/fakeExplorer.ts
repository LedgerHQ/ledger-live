import type { Explorer } from "../network/explorer";
import type { ExplorerTx, ExplorerTxsPage } from "../network/types";

export const BTC_RECIPIENT = "bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs";
export const BTC_CHANGE = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
export const BTC_LEGACY = "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2";

/** `/fees` presets, sat/kB: 20, 10 and 5 sat/vB. */
export const DEFAULT_FEES = { "1": 20_000, "3": 10_000, "6": 5_000, last_updated: 1_700_000_000 };

type FakeExplorerSetup = {
  fees?: Record<string, number>;
  relayFee?: string | null;
  incrementalFee?: string | null;
  tip?: { height: number; hash: string; time: string };
  txHex?: Record<string, string>;
  /** Confirmed pages per address, served in order through the `token`. */
  pages?: Record<string, ExplorerTxsPage[]>;
  pending?: Record<string, ExplorerTx[]>;
  spentAtHeight?: Record<string, Record<number, number | null>>;
};

export function fakeExplorer(setup: FakeExplorerSetup = {}): Explorer & {
  broadcasted: Array<{ tx: string; source: unknown }>;
} {
  const broadcasted: Array<{ tx: string; source: unknown }> = [];
  const tip = setup.tip ?? { height: 800_000, hash: "tip-hash", time: "2026-01-01T00:00:00Z" };
  return {
    baseUrl: `fake://${Math.random()}`,
    broadcasted,
    getCurrentBlock: jest.fn(async () => tip),
    getBlockByHeight: jest.fn(async (height: number) =>
      height === tip.height ? tip : { height, hash: `hash-${height}`, time: tip.time },
    ),
    getFees: jest.fn(async () => setup.fees ?? DEFAULT_FEES),
    getNetwork: jest.fn(async () => ({
      relay_fee: setup.relayFee === undefined ? "0.00001000" : setup.relayFee,
      incremental_fee: setup.incrementalFee === undefined ? "0.00001000" : setup.incrementalFee,
    })),
    getTxHex: jest.fn(async (txid: string) => {
      const hex = setup.txHex?.[txid];
      if (!hex) throw new Error(`no hex for ${txid}`);
      return hex;
    }),
    getUtxoTx: jest.fn(async (txid: string) => ({
      outputs: Object.entries(setup.spentAtHeight?.[txid] ?? {}).map(([index, height]) => ({
        output_index: Number(index),
        spent_at_height: height,
      })),
    })),
    getAddressTxs: jest.fn(async (address: string, params: { token?: string }) => {
      const pages = setup.pages?.[address] ?? [];
      const index = params.token ? Number(params.token.split("-").pop()) : 0;
      return pages[index] ?? { data: [], token: null };
    }),
    getAddressPendingTxs: jest.fn(async (address: string) => setup.pending?.[address] ?? []),
    broadcast: jest.fn(async (tx: string, source?: unknown) => {
      broadcasted.push({ tx, source });
      return "broadcast-txid";
    }),
  };
}

export const explorerTx = (tx: Partial<ExplorerTx> & Pick<ExplorerTx, "id">): ExplorerTx => ({
  received_at: "2026-01-01T00:00:00Z",
  block: { height: 799_990, hash: "block-hash", time: "2026-01-01T00:00:00Z" },
  inputs: [],
  outputs: [],
  fees: 0,
  ...tx,
});
