import type { UtxoCoinModuleApi, UtxoTransaction } from "../types";

export const tx = (id: string, fields: Partial<UtxoTransaction> = {}): UtxoTransaction => ({
  id,
  receivedAt: "2026-01-01T00:00:00.000Z",
  block: { height: 5, hash: "h5", time: "2026-01-01T00:00:00.000Z" },
  fees: "0",
  replaceable: false,
  inputs: [],
  outputs: [],
  ...fields,
});

/** A jest mock typed after the port method it stands for. */
const mock = <F extends (...args: any[]) => any>(implementation: F): jest.MockedFunction<F> =>
  jest.fn(implementation) as unknown as jest.MockedFunction<F>;

type Api = Required<UtxoCoinModuleApi>;

export const addressAt = (chain: number, index: number): string => `addr-${chain}-${index}`;

/**
 * A chain held in memory behind the UTXO port: addresses are `addr-<chain>-<index>`, each
 * transaction is listed for every address it touches, two per page.
 */
export function fakeChain(transactions: UtxoTransaction[] = [], tipHeight = 100) {
  const chain = {
    transactions,
    tipHeight,
    blockHashes: new Map<number, string>(),
  };
  const touches = (t: UtxoTransaction, address: string) =>
    t.inputs.some(i => i.address === address) || t.outputs.some(o => o.address === address);

  const api = {
    lastBlock: mock<Api["lastBlock"]>(async () => ({
      height: chain.tipHeight,
      hash: `h${chain.tipHeight}`,
      time: new Date("2026-01-02T00:00:00.000Z"),
    })),
    getBlockInfo: mock<Api["getBlockInfo"]>(async (_context, height) => ({
      height,
      hash: chain.blockHashes.get(height) ?? `h${height}`,
      time: new Date("2026-01-01T00:00:00.000Z"),
    })),
    deriveAddress: mock<Api["deriveAddress"]>(async (_context, request) =>
      addressAt(request.chain, request.index),
    ),
    listAddressTransactions: mock<Api["listAddressTransactions"]>(
      async (_context, address, options) => {
        const all = chain.transactions.filter(
          t => touches(t, address) && (!t.block || t.block.height >= options.minHeight),
        );
        const start = options.cursor ? Number(options.cursor) : 0;
        const items = all.slice(start, start + 2);
        const next = start + 2 < all.length ? String(start + 2) : undefined;
        return { items, next };
      },
    ),
    getTransaction: mock<Api["getTransaction"]>(async (_context, txid) => {
      const found = chain.transactions.find(t => t.id === txid);
      if (!found) throw new Error(`unknown ${txid}`);
      return found;
    }),
    selectInputs: mock<Api["selectInputs"]>(async () => []),
    estimateFees: mock<Api["estimateFees"]>(async () => ({ value: 10n })),
    validateIntent: mock<Api["validateIntent"]>(async () => ({
      errors: {},
      warnings: {},
      estimatedFees: 10n,
      amount: 0n,
      totalSpent: 0n,
    })),
    craftTransaction: mock<Api["craftTransaction"]>(async () => ({ transaction: "unsigned" })),
    combine: mock<Api["combine"]>(async () => "signed"),
    broadcast: mock<Api["broadcast"]>(async () => "broadcast-hash"),
    craftTransactionData: mock<Api["craftTransactionData"]>(() => ({ type: "fake" })),
    displayAddress: mock<Api["displayAddress"]>((address: string) => address.toUpperCase()),
  };

  return { chain, api };
}
