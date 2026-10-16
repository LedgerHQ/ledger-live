import type {
  AccountInfo,
  AssetInfo,
  Balance,
  BalanceOptions,
  BlockInfo,
  CraftedTransaction,
  FeeEstimation,
  Operation as CoinOperation,
  Page,
  TransactionIntent,
  TransactionValidation,
  TxData,
  Validator,
} from "@ledgerhq/coin-module-framework/api/types";

/** What the network of a scenario holds; the steps of a scenario change it between syncs. */
export type FakeChain = {
  tip: BlockInfo;
  /** The network's balance list, in its order. */
  balances: Balance[];
  /** Every operation of the address, listed in this order (newest first). */
  operations: CoinOperation[];
  /** Operations per page of a listing; all of them in one page when absent. */
  pageSize?: number;
  /** The listing starts with an empty page carrying a cursor (coin-cosmos windows parsing to nothing). */
  leadingEmptyPage?: boolean;
  validators?: Validator[];
  /** ADR-045 account metadata; `{ type: "none" }` when absent. */
  accountInfo?: AccountInfo;
  /** A rejection of `getAccountInfo`. */
  accountInfoError?: Error;
  /** The answer of the read-only contract call; the call is unsupported when absent. */
  call?: (params: unknown) => unknown;
  /** The accounts a public key controls (ADR-055); the extra member is absent when undefined. */
  addressesForPublicKey?: (publicKey: string) => string[];
  nextSequence?: bigint;
  estimate?: (intent: TransactionIntent<any, any>, options: unknown) => FeeEstimation;
  validate?: (
    intent: TransactionIntent<any, any>,
    balances: Balance[],
    options: { customFees?: FeeEstimation } | undefined,
  ) => TransactionValidation;
  /** The data the coin module crafts for an intent that carries none. */
  craftData?: (intent: TransactionIntent<any, any>) => TxData;
  /** The signed form of a crafted transaction; `<unsigned>+<signature>` when absent. */
  combine?: (transaction: string, signatures: string[]) => string;
  /** Capabilities `supports` answers false for. */
  unsupported?: string[];
};

const PAGE_CURSOR = "page-";

/** The data of a UTXO intent, which the account module completed (inputs, replacement). */
type UtxoData = { inputs?: Array<{ txid: string; vout: number }>; replacement?: { txid: string } };
const utxoDataOf = (intent: TransactionIntent<any, any>): UtxoData | undefined =>
  (intent as { data?: UtxoData }).data;
/** The inputs of an intent the account module completed: it always selects some. */
const inputsOf = (intent: TransactionIntent<any, any>) =>
  (utxoDataOf(intent) as Required<UtxoData>).inputs;

const isPlain = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));

/**
 * A copy of what a method received, as it was when called: a caller may complete an intent after
 * handing it over (`transactionToIntent` sets `data` once the coin module crafted it).
 */
function snapshot(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(snapshot);
  if (value instanceof Map) return new Map([...value].map(([key, item]) => [key, snapshot(item)]));
  if (isPlain(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshot(item)]));
  }
  return value;
}

/** The arguments each call received, snapshotted when made. */
const SNAPSHOTS = new WeakMap<jest.Mock, unknown[][]>();

/** `methods` as jest mocks recording a snapshot of their arguments, `guard` run before each. */
function recording<M extends Record<string, (...args: any[]) => unknown>>(
  methods: M,
  guard: (method: string) => void,
): { [K in keyof M]: jest.Mock } {
  return Object.fromEntries(
    Object.entries(methods).map(([name, method]) => {
      const calls: unknown[][] = [];
      const mock = jest.fn((...args: unknown[]) => {
        calls.push(args.map(snapshot));
        guard(name);
        return method(...args);
      });
      SNAPSHOTS.set(mock, calls);
      return [name, mock];
    }),
  ) as { [K in keyof M]: jest.Mock };
}

/** The pages of a listing from `minHeight`: what the chain holds at or above it, in its order. */
function pagesOf(chain: FakeChain, minHeight: number): CoinOperation[][] {
  const listed = chain.operations.filter(({ tx }) => tx.block.height >= minHeight);
  const size = chain.pageSize ?? Math.max(listed.length, 1);
  const pages: CoinOperation[][] = [];
  for (let start = 0; start < listed.length; start += size) {
    pages.push(listed.slice(start, start + size));
  }
  return chain.leadingEmptyPage ? [[], ...pages] : pages;
}

/**
 * The validation a module answers when the scenario sets none: valid, the custom fee (the bridge
 * always validates with one) on top for the native asset.
 */
function defaultValidation(
  intent: TransactionIntent<any, any>,
  options: { customFees: FeeEstimation },
): TransactionValidation {
  const fee = options.customFees.value;
  return {
    errors: {},
    warnings: {},
    estimatedFees: fee,
    amount: intent.amount,
    totalSpent: intent.asset.type === "native" ? intent.amount + fee : intent.amount,
  };
}

/** The asset filter of `options`, as coin-evm applies its CAL filter. */
async function included(balances: Balance[], options?: BalanceOptions): Promise<Balance[]> {
  const filter = options?.includeAssets;
  if (!filter) return balances;
  const kept = await Promise.all(balances.map(({ asset }: { asset: AssetInfo }) => filter(asset)));
  return balances.filter((_, index) => kept[index]);
}

/**
 * A coin module answering from `chain`, every method a jest mock recording its calls. `guard` runs
 * before each method (the no-bypass test fails a call made around the portfolio layer there).
 */
export function fakeCoinModule(chain: FakeChain, guard: (method: string) => void = () => {}) {
  const lookup = chain.addressesForPublicKey;
  const methods = {
    lastBlock: async () => chain.tip,
    getBalance: async (_context: unknown, _address: string, options?: BalanceOptions) =>
      included(chain.balances, options),
    listOperations: async (
      _context: unknown,
      _address: string,
      { minHeight, cursor }: { minHeight: number; cursor?: string },
    ): Promise<Page<CoinOperation>> => {
      const pages = pagesOf(chain, minHeight);
      const index = cursor ? Number(cursor.slice(PAGE_CURSOR.length)) : 0;
      const next = index + 1 < pages.length ? `${PAGE_CURSOR}${index + 1}` : undefined;
      return { items: pages[index] ?? [], next };
    },
    getValidators: async () => ({ items: chain.validators ?? [] }),
    getAccountInfo: async () => {
      if (chain.accountInfoError) throw chain.accountInfoError;
      return chain.accountInfo ?? { type: "none" };
    },
    // Called only when `supports("call")` says so, that is when the scenario answers it.
    call: async (_context: unknown, params: unknown) =>
      (chain.call as (params: unknown) => unknown)(params),
    getNextSequence: async () => chain.nextSequence ?? 7n,
    estimateFees: async (
      _context: unknown,
      intent: TransactionIntent<any, any>,
      options?: unknown,
    ): Promise<FeeEstimation> =>
      chain.estimate?.(intent, options) ?? { value: 12n, parameters: { estimated: 12n } },
    validateIntent: async (
      _context: unknown,
      intent: TransactionIntent<any, any>,
      balances: Balance[],
      options: { customFees: FeeEstimation },
    ) => chain.validate?.(intent, balances, options) ?? defaultValidation(intent, options),
    craftTransaction: async (
      _context: unknown,
      intent: TransactionIntent<any, any>,
    ): Promise<CraftedTransaction> => ({
      transaction: `unsigned:${intent.type}:${intent.sequence}`,
      details: { size: 10n },
    }),
    craftRawTransaction: async (
      _context: unknown,
      transaction: string,
      _sender: string,
      _publicKey: string,
      sequence: bigint,
    ): Promise<CraftedTransaction> => ({ transaction: `raw:${transaction}:${sequence}` }),
    craftTransactionData: (_context: unknown, intent: TransactionIntent<any, any>): TxData =>
      chain.craftData?.(intent) ?? { type: "none" },
    combine: async (_context: unknown, transaction: string, signatures: string[]) =>
      chain.combine?.(transaction, signatures) ?? `${transaction}+${signatures[0]}`,
    broadcast: async () => "broadcast-hash",
    validateAddress: async (_context: unknown, address: string) => !address.startsWith("bad"),
    ...(lookup
      ? {
          getAddressesForPublicKey: async (_context: unknown, publicKey: string) =>
            lookup(publicKey),
        }
      : {}),
  };

  const mocks = recording(methods, guard);
  const unsupported = new Set(chain.unsupported ?? []);
  if (!chain.call) unsupported.add("call");
  return {
    ...mocks,
    /** The capability test `withDefaults` attaches: a method it implements and supports. */
    supports: (name: string) => name in mocks && !unsupported.has(name),
  };
}

export type FakeCoinModule = ReturnType<typeof fakeCoinModule>;

/** Arguments without the trailing undefined ones: `f(a)` and `f(a, undefined)` receive the same. */
function withoutTrailingUndefined(args: unknown[]): unknown[] {
  let end = args.length;
  while (end > 0 && args[end - 1] === undefined) end -= 1;
  return args.slice(0, end);
}

/**
 * The calls a mock received, as they were when made, without the context argument (each path
 * builds its own) nor trailing undefined arguments.
 */
export const callsOf = (mock: jest.Mock): unknown[][] =>
  (SNAPSHOTS.get(mock) as unknown[][]).map(args => withoutTrailingUndefined(args.slice(1)));

/** A transaction of a UTXO chain (account-module-utxo's `UtxoTransaction`). */
export type FakeUtxoTransaction = {
  id: string;
  receivedAt: string;
  block: { height: number; hash: string; time: string } | null;
  fees: string;
  replaceable: boolean;
  inputs: Array<{ txid?: string; vout: number; address?: string; value: string }>;
  outputs: Array<{ index: number; address?: string; value: string }>;
};

/** What a UTXO network of a scenario holds. */
export type FakeUtxoChain = {
  tipHeight: number;
  transactions: FakeUtxoTransaction[];
  /** The fee rates of an estimate, per strategy. */
  feePerByte?: bigint;
  /** The validation of an intent the account module completed; the default one when absent. */
  validate?: (
    intent: TransactionIntent<any, any>,
    options: { customFees: FeeEstimation },
  ) => TransactionValidation;
};

/** The address of an account key on an HD chain: `addr-<chain>-<index>`. */
export const utxoAddress = (chain: number, index: number): string => `addr-${chain}-${index}`;

/**
 * A UTXO coin module answering from `chain` (account-module-utxo's port), every method a jest mock.
 * Each transaction is listed for every address it touches, in one page.
 */
export function fakeUtxoCoinModule(
  chain: FakeUtxoChain,
  guard: (method: string) => void = () => {},
) {
  const touches = (tx: FakeUtxoTransaction, address: string) =>
    tx.inputs.some(input => input.address === address) ||
    tx.outputs.some(output => output.address === address);
  const blockTime = (height: number) => new Date(Date.UTC(2026, 9, 1) + height * 60_000);
  const feePerByte = () => chain.feePerByte ?? 10n;
  /**
   * What coin-bitcoin's replacement estimate reads of the replaced transaction, whichever form the
   * intent takes (the txid alone, or the inputs the UTXO account module completed).
   */
  const replacementOf = (txid: string | undefined) => {
    const replaced = chain.transactions.find(({ id }) => id === txid);
    if (!replaced) return {};
    const originalFee = BigInt(replaced.fees);
    return {
      originalFee,
      originalFeePerByte: originalFee / 141n,
      minReplacementFee: originalFee + 141n,
      minReplacementFeePerByte: originalFee / 141n + 1n,
      replacedInputs: replaced.inputs.map(input => ({ ...input, value: BigInt(input.value) })),
      replacedOutputs: replaced.outputs.map(({ address, value }) => ({
        address,
        value: BigInt(value),
      })),
    };
  };

  const methods = {
    lastBlock: async () => ({
      height: chain.tipHeight,
      hash: `block-${chain.tipHeight}`,
      time: blockTime(chain.tipHeight),
    }),
    getBlockInfo: async (_context: unknown, height: number) => ({
      height,
      hash: `block-${height}`,
      time: blockTime(height),
    }),
    deriveAddress: async (_context: unknown, request: { chain: number; index: number }) =>
      utxoAddress(request.chain, request.index),
    listAddressTransactions: async (
      _context: unknown,
      address: string,
      { minHeight }: { minHeight: number },
    ) => ({
      items: chain.transactions.filter(
        tx => touches(tx, address) && (!tx.block || tx.block.height >= minHeight),
      ),
      next: undefined,
    }),
    getTransaction: async (_context: unknown, txid: string) =>
      chain.transactions.find(tx => tx.id === txid),
    selectInputs: async (
      _context: unknown,
      { candidates }: { candidates: Array<{ txid: string; vout: number }> },
    ) => candidates.slice(0, 1).map(({ txid, vout }) => ({ txid, vout })),
    estimateFees: async (_context: unknown, intent: TransactionIntent<any, any>) => ({
      value: 141n * feePerByte(),
      parameters: {
        feePerByte: feePerByte(),
        feeRates: { slow: feePerByte() - 2n, medium: feePerByte() - 1n, fast: feePerByte() },
        ...replacementOf(utxoDataOf(intent)?.replacement?.txid),
      },
    }),
    validateIntent: async (
      _context: unknown,
      intent: TransactionIntent<any, any>,
      _balances: Balance[],
      options: { customFees: FeeEstimation },
    ) => chain.validate?.(intent, options) ?? defaultValidation(intent, options),
    craftTransaction: async (_context: unknown, intent: TransactionIntent<any, any>) => ({
      transaction: `psbt:${intent.type}:${inputsOf(intent).length}`,
      details: {
        inputs: inputsOf(intent).map(input => `${input.txid}-${input.vout}`),
        fee: 141n * feePerByte(),
        amount: intent.amount,
        senders: [utxoAddress(0, 0)],
        recipients: [intent.recipient],
        replaceable: true,
      },
    }),
    craftTransactionData: (_context: unknown, intent: TransactionIntent<any, any>) => ({
      type: "bitcoin",
      ...utxoDataOf(intent),
    }),
    combine: async (_context: unknown, transaction: string, signatures: string[]) =>
      `${transaction}+${signatures[0]}`,
    broadcast: async () => "utxo-broadcast-hash",
    validateAddress: async (_context: unknown, address: string) => !address.startsWith("bad"),
  };

  const mocks = recording(methods, guard);
  return mocks;
}

export type FakeUtxoCoinModule = ReturnType<typeof fakeUtxoCoinModule>;
