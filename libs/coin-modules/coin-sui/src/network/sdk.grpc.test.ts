import type { SuiGrpcClient } from "@mysten/sui/grpc";
import { deriveDynamicFieldID } from "@mysten/sui/utils";
import {
  fetchExchangeRatesGrpc,
  getAllBalancesGrpc,
  getCheckpointGrpc,
  getLastBlockGrpc,
  getStakingEventsByDigestGrpc,
} from "./sdk.grpc";

const CANONICAL_SUI = `0x${"0".repeat(63)}2::sui::SUI`;
const OWNER_SHORT = "0x1";
const OWNER_CANONICAL = `0x${"0".repeat(63)}1`;

type BalancePage = {
  balances: Array<{ coinType?: string; balance?: bigint; addressBalance?: bigint }>;
  nextPageToken?: Uint8Array;
};

/** Minimal `SuiGrpcClient` stand-in exposing only the StateService call under test. */
function stubApi(...pages: BalancePage[]) {
  const listBalances = jest.fn();
  pages.forEach(page => listBalances.mockReturnValueOnce({ response: Promise.resolve(page) }));
  return { api: { stateService: { listBalances } } as unknown as SuiGrpcClient, listBalances };
}

describe("getAllBalancesGrpc", () => {
  it("maps the SIP-58 total and address-balance share onto CoinBalance", async () => {
    const { api } = stubApi({
      balances: [{ coinType: CANONICAL_SUI, balance: 300n, addressBalance: 100n }],
    });

    await expect(getAllBalancesGrpc(api, OWNER_SHORT)).resolves.toEqual([
      {
        coinType: "0x2::sui::SUI",
        coinObjectCount: 0,
        totalBalance: "300",
        lockedBalance: {},
        fundsInAddressBalance: "100",
      },
    ]);
  });

  // Downstream compares against DEFAULT_COIN_TYPE with `===`; an un-shortened canonical tag
  // would miss silently rather than throw.
  it("shortens canonical struct tags", async () => {
    const { api } = stubApi({ balances: [{ coinType: CANONICAL_SUI, balance: 1n }] });

    const [balance] = await getAllBalancesGrpc(api, OWNER_SHORT);
    expect(balance.coinType).toBe("0x2::sui::SUI");
  });

  it("defaults absent wire amounts to '0'", async () => {
    const { api } = stubApi({ balances: [{ coinType: CANONICAL_SUI }] });

    const [balance] = await getAllBalancesGrpc(api, OWNER_SHORT);
    expect(balance.totalBalance).toBe("0");
    expect(balance.fundsInAddressBalance).toBe("0");
  });

  it("normalises the owner to canonical form before querying", async () => {
    const { api, listBalances } = stubApi({ balances: [] });

    await getAllBalancesGrpc(api, OWNER_SHORT);

    expect(listBalances).toHaveBeenCalledWith(expect.objectContaining({ owner: OWNER_CANONICAL }));
  });

  it("drops entries with no coin type", async () => {
    const { api } = stubApi({
      balances: [{ balance: 5n }, { coinType: CANONICAL_SUI, balance: 7n }],
    });

    await expect(getAllBalancesGrpc(api, OWNER_SHORT)).resolves.toHaveLength(1);
  });

  describe("pagination", () => {
    it("follows nextPageToken and concatenates pages", async () => {
      const token = new Uint8Array([1, 2, 3]);
      const { api, listBalances } = stubApi(
        { balances: [{ coinType: CANONICAL_SUI, balance: 1n }], nextPageToken: token },
        { balances: [{ coinType: `0x${"0".repeat(63)}3::foo::BAR`, balance: 2n }] },
      );

      const balances = await getAllBalancesGrpc(api, OWNER_SHORT);

      expect(balances.map(b => b.coinType)).toEqual(["0x2::sui::SUI", "0x3::foo::BAR"]);
      expect(listBalances).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ pageToken: token }),
      );
    });

    it("treats an empty token as the last page", async () => {
      const { api, listBalances } = stubApi({
        balances: [{ coinType: CANONICAL_SUI, balance: 1n }],
        nextPageToken: new Uint8Array(),
      });

      await getAllBalancesGrpc(api, OWNER_SHORT);

      expect(listBalances).toHaveBeenCalledTimes(1);
    });

    it("stops with an explicit error if the server never stops handing out tokens", async () => {
      const listBalances = jest.fn().mockReturnValue({
        response: Promise.resolve({
          balances: [{ coinType: CANONICAL_SUI, balance: 1n }],
          nextPageToken: new Uint8Array([9]),
        }),
      });
      const api = { stateService: { listBalances } } as unknown as SuiGrpcClient;

      await expect(getAllBalancesGrpc(api, OWNER_SHORT)).rejects.toThrow(/exceeded 100 pages/);
    });
  });
});

type GrpcCheckpoint = {
  sequenceNumber?: bigint;
  digest?: string;
  summary?: { timestamp?: { seconds: bigint; nanos: number }; previousDigest?: string };
};

function stubCheckpointApi(checkpoint?: GrpcCheckpoint) {
  const getCheckpoint = jest.fn().mockReturnValue({ response: Promise.resolve({ checkpoint }) });
  return { api: { ledgerService: { getCheckpoint } } as unknown as SuiGrpcClient, getCheckpoint };
}

const SUMMARY = { timestamp: { seconds: 1784368593n, nanos: 664_000_000 }, previousDigest: "prev" };

describe("getCheckpointGrpc", () => {
  it("converts protobuf seconds+nanos into JSON-RPC's millisecond string", async () => {
    const { api } = stubCheckpointApi({
      sequenceNumber: 300000000n,
      digest: "d",
      summary: SUMMARY,
    });

    await expect(getCheckpointGrpc(api, "300000000")).resolves.toEqual({
      digest: "d",
      sequenceNumber: "300000000",
      timestampMs: "1784368593664",
      previousDigest: "prev",
    });
  });

  it("omits previousDigest when the summary has none", async () => {
    const { api } = stubCheckpointApi({
      sequenceNumber: 1n,
      digest: "d",
      summary: { timestamp: { seconds: 1n, nanos: 0 } },
    });

    await expect(getCheckpointGrpc(api, "1")).resolves.not.toHaveProperty("previousDigest");
  });

  // GraphQL rejects digests outright; gRPC selects the matching oneof instead.
  it("routes a numeric id to sequenceNumber", async () => {
    const { api, getCheckpoint } = stubCheckpointApi({
      sequenceNumber: 7n,
      digest: "d",
      summary: SUMMARY,
    });

    await getCheckpointGrpc(api, "7");

    expect(getCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        checkpointId: { oneofKind: "sequenceNumber", sequenceNumber: 7n },
      }),
    );
  });

  it("routes a base58 digest to the digest oneof", async () => {
    const { api, getCheckpoint } = stubCheckpointApi({
      sequenceNumber: 7n,
      digest: "HFBZdR7",
      summary: SUMMARY,
    });

    await getCheckpointGrpc(api, "HFBZdR7");

    expect(getCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({ checkpointId: { oneofKind: "digest", digest: "HFBZdR7" } }),
    );
  });

  it("throws when the checkpoint is absent", async () => {
    const { api } = stubCheckpointApi(undefined);

    await expect(getCheckpointGrpc(api, "1")).rejects.toThrow(/Checkpoint not found/);
  });

  // Every caller masks in `digest` and `summary.timestamp`, so an absent one is a malformed response.
  // Coercing it would report a block with an empty hash or a 1970 timestamp, as the GraphQL arm would.
  it.each([
    ["digest", { sequenceNumber: 7n, summary: SUMMARY }, /has no digest/],
    ["timestamp", { sequenceNumber: 7n, digest: "d" }, /has no timestamp/],
  ])("throws when the checkpoint has no %s", async (_label, checkpoint, expected) => {
    const { api } = stubCheckpointApi(checkpoint);

    await expect(getCheckpointGrpc(api, "7")).rejects.toThrow(expected);
  });
});

describe("getLastBlockGrpc", () => {
  // An unset oneof asks the server for the tip, so no separate "latest sequence" call is made.
  it("requests the tip with an unset checkpoint id", async () => {
    const { api, getCheckpoint } = stubCheckpointApi({
      sequenceNumber: 9n,
      digest: "tip",
      summary: SUMMARY,
    });

    const tip = await getLastBlockGrpc(api);

    expect(getCheckpoint).toHaveBeenCalledTimes(1);
    expect(getCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({ checkpointId: { oneofKind: undefined } }),
    );
    expect(tip.sequenceNumber).toBe("9");
  });
});

describe("getStakingEventsByDigestGrpc", () => {
  const stubCore = (result: unknown) => {
    const getTransaction = jest.fn().mockResolvedValue(result);
    return {
      api: { core: { getTransaction } } as unknown as SuiGrpcClient,
      getTransaction,
    };
  };

  it("renames Core's eventType/json onto the JSON-RPC event view", async () => {
    const { api } = stubCore({
      $kind: "Transaction",
      Transaction: {
        events: [
          {
            eventType: `0x${"0".repeat(62)}3::validator::StakingRequestEvent`,
            json: { validator_address: "0xval", amount: "1000" },
          },
        ],
      },
    });

    await expect(getStakingEventsByDigestGrpc(api, "d")).resolves.toEqual([
      {
        type: "0x3::validator::StakingRequestEvent",
        parsedJson: { validator_address: "0xval", amount: "1000" },
      },
    ]);
  });

  // A failed staking transaction still carries the events the extractor reads.
  it("reads events from a FailedTransaction result", async () => {
    const { api } = stubCore({
      $kind: "FailedTransaction",
      FailedTransaction: { events: [{ eventType: "0x3::a::B", json: null }] },
    });

    await expect(getStakingEventsByDigestGrpc(api, "d")).resolves.toEqual([
      { type: "0x3::a::B", parsedJson: undefined },
    ]);
  });

  it("returns an empty list when the transaction has no events", async () => {
    const { api } = stubCore({ $kind: "Transaction", Transaction: {} });

    await expect(getStakingEventsByDigestGrpc(api, "d")).resolves.toEqual([]);
  });

  it("requests only the events payload", async () => {
    const { api, getTransaction } = stubCore({ $kind: "Transaction", Transaction: { events: [] } });

    await getStakingEventsByDigestGrpc(api, "digest-1");

    expect(getTransaction).toHaveBeenCalledWith({ digest: "digest-1", include: { events: true } });
  });
});

describe("fetchExchangeRatesGrpc", () => {
  const RATES_TABLE = `0x${"e".repeat(64)}`;

  /** `Field<u64, PoolTokenExchangeRate>` as the node renders it, wrapped as a protobuf `Value`. */
  const fieldJson = (epoch: number, sui: string, poolToken: string) => ({
    kind: {
      oneofKind: "structValue",
      structValue: {
        fields: {
          name: { kind: { oneofKind: "stringValue", stringValue: String(epoch) } },
          value: {
            kind: {
              oneofKind: "structValue",
              structValue: {
                fields: {
                  sui_amount: { kind: { oneofKind: "stringValue", stringValue: sui } },
                  pool_token_amount: {
                    kind: { oneofKind: "stringValue", stringValue: poolToken },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  /** The code attributes results by `object_id`, so the stub echoes the id back like the node does. */
  const found = (json: unknown, objectId?: string) => ({
    result: { oneofKind: "object", object: { objectId, json } },
  });
  const notFound = () => ({ result: { oneofKind: "error", error: { code: 5 } } });

  type BatchRequest = { requests: { objectId: string }[] };

  /** `impl` receives the derived field ids of one batch and returns that batch's results. */
  const stubRates = (impl: (ids: string[]) => unknown[] | Promise<unknown[]>) => {
    const calls: string[][] = [];
    const batchGetObjects = jest.fn((req: BatchRequest) => {
      const ids = req.requests.map(r => r.objectId);
      calls.push(ids);
      return {
        response: Promise.resolve(impl(ids)).then(objects => ({
          // Default to a well-behaved server: every result carries the id it was asked for. The
          // tests that exercise omission or reordering pass the id explicitly instead.
          objects: (objects as { result?: { object?: { objectId?: string } } }[]).map(
            (entry, index) => {
              const object = entry?.result?.object;
              if (object && object.objectId === undefined) object.objectId = ids[index];
              return entry;
            },
          ),
        })),
      };
    });
    return {
      api: { ledgerService: { batchGetObjects } } as unknown as SuiGrpcClient,
      batchGetObjects,
      calls,
    };
  };

  it("reads both u64 amounts from the field's Move JSON as decimal strings", async () => {
    const { api } = stubRates(() => [found(fieldJson(1, "10043452998036132", "9194049010784817"))]);

    const { rates, missing } = await fetchExchangeRatesGrpc(api, [
      { exchangeRatesId: RATES_TABLE, epoch: 1 },
    ]);

    expect(rates).toEqual([
      { sui_amount: "10043452998036132", pool_token_amount: "9194049010784817" },
    ]);
    expect(missing).toBe(0);
  });

  // The epoch is the dynamic-field key, and the object id is derived from it locally. A big-endian
  // slip would derive an id that resolves to nothing — or worse, another epoch's field.
  it("derives the field id from a little-endian u64 epoch key", async () => {
    const { api, calls } = stubRates(ids => ids.map(() => notFound()));

    await fetchExchangeRatesGrpc(api, [{ exchangeRatesId: RATES_TABLE, epoch: 258 }]);

    const littleEndian = new Uint8Array([2, 1, 0, 0, 0, 0, 0, 0]);
    expect(calls[0][0]).toBe(deriveDynamicFieldID(RATES_TABLE, { u64: true }, littleEndian));
  });

  // Collapsing many lookups into positional batch results is the whole point of the change; a
  // shifted index would attribute one pool's rate to another with no error anywhere.
  it("preserves input order across batches", async () => {
    const epochs = Array.from({ length: 250 }, (_, i) => i + 1);
    const byId = new Map(
      epochs.map(epoch => {
        const key = new Uint8Array(8);
        new DataView(key.buffer).setBigUint64(0, BigInt(epoch), true);
        return [deriveDynamicFieldID(RATES_TABLE, { u64: true }, key), epoch];
      }),
    );
    const { api, calls } = stubRates(ids =>
      ids.map(id => found(fieldJson(byId.get(id)!, String(byId.get(id)), "1"))),
    );

    const { rates } = await fetchExchangeRatesGrpc(
      api,
      epochs.map(epoch => ({ exchangeRatesId: RATES_TABLE, epoch })),
    );

    expect(rates.map(r => r?.sui_amount)).toEqual(epochs.map(String));
    // 250 lookups at 100 per batch — proof the batching is real, not a single passthrough.
    expect(calls.map(c => c.length)).toEqual([100, 100, 50]);
  });

  // Guards the degradation policy: a failure must stay confined to its own slot.
  it("yields null and counts a missing field without rejecting", async () => {
    const { api } = stubRates(ids =>
      ids.map((_, index) => (index === 1 ? notFound() : found(fieldJson(1, "5", "5")))),
    );

    const { rates, missing, chunksFailed } = await fetchExchangeRatesGrpc(api, [
      { exchangeRatesId: RATES_TABLE, epoch: 1 },
      { exchangeRatesId: RATES_TABLE, epoch: 2 },
      { exchangeRatesId: RATES_TABLE, epoch: 3 },
    ]);

    expect(rates[1]).toBeNull();
    expect(rates[0]).not.toBeNull();
    expect(rates[2]).not.toBeNull();
    expect(missing).toBe(1);
    expect(chunksFailed).toBe(0);
  });

  // A whole batch failing must null-pad rather than truncate, or every later rate shifts.
  it("null-pads a batch that fails outright", async () => {
    const { api } = stubRates(() => Promise.reject(new Error("UNAVAILABLE")));

    const { rates, missing, chunksFailed } = await fetchExchangeRatesGrpc(api, [
      { exchangeRatesId: RATES_TABLE, epoch: 1 },
      { exchangeRatesId: RATES_TABLE, epoch: 2 },
    ]);

    expect(rates).toEqual([null, null]);
    // Both nulls come from one refused batch, not from two absent rates. Reporting them apart is
    // what makes a degraded rollout readable: "the server refused" reads nothing like "no such rate".
    expect(missing).toBe(2);
    expect(chunksFailed).toBe(1);
  });

  // A short result list would otherwise shift every subsequent rate onto the wrong pool.
  it("null-pads when the server returns fewer results than requested", async () => {
    const { api } = stubRates(() => [found(fieldJson(1, "7", "7"))]);

    const { rates, missing } = await fetchExchangeRatesGrpc(api, [
      { exchangeRatesId: RATES_TABLE, epoch: 1 },
      { exchangeRatesId: RATES_TABLE, epoch: 2 },
    ]);

    expect(rates[0]).toEqual({ sui_amount: "7", pool_token_amount: "7" });
    expect(rates[1]).toBeNull();
    expect(missing).toBe(1);
  });

  // Attribution is by object id, not position. A server that omits a MIDDLE slot, reorders, or
  // deduplicates would otherwise shift a valid rate onto the wrong pool — the wrong validator's
  // reward and APY, with no error raised anywhere.
  it("attributes rates by object id when a middle result is missing", async () => {
    const epochs = [1, 2, 3];
    const idFor = (epoch: number) => {
      const key = new Uint8Array(8);
      new DataView(key.buffer).setBigUint64(0, BigInt(epoch), true);
      return deriveDynamicFieldID(RATES_TABLE, { u64: true }, key);
    };
    const { api } = stubRates(ids =>
      // Epoch 2's slot is dropped entirely rather than returned as an error slot. Each surviving
      // result carries its own id, so only id-based attribution can place them correctly.
      ids
        .filter(id => id !== idFor(2))
        .map(id => found(fieldJson(0, id === idFor(1) ? "1" : "3", "1"), id)),
    );

    const { rates, missing } = await fetchExchangeRatesGrpc(
      api,
      epochs.map(epoch => ({ exchangeRatesId: RATES_TABLE, epoch })),
    );

    expect(rates.map(r => r?.sui_amount)).toEqual(["1", undefined, "3"]);
    expect(rates[1]).toBeNull();
    expect(missing).toBe(1);
  });

  it("attributes rates by object id when results come back reordered", async () => {
    const epochs = [1, 2, 3];
    const byId = new Map(
      epochs.map(epoch => {
        const key = new Uint8Array(8);
        new DataView(key.buffer).setBigUint64(0, BigInt(epoch), true);
        return [deriveDynamicFieldID(RATES_TABLE, { u64: true }, key), epoch];
      }),
    );
    const { api } = stubRates(ids =>
      [...ids].reverse().map(id => found(fieldJson(0, String(byId.get(id)), "1"), id)),
    );

    const { rates } = await fetchExchangeRatesGrpc(
      api,
      epochs.map(epoch => ({ exchangeRatesId: RATES_TABLE, epoch })),
    );

    expect(rates.map(r => r?.sui_amount)).toEqual(["1", "2", "3"]);
  });

  it("ignores an object it never requested", async () => {
    const { api } = stubRates(ids => [
      found(fieldJson(0, "9", "1")),
      { result: { oneofKind: "object", object: { objectId: "0xdeadbeef", json: undefined } } },
      ...ids.slice(1).map(() => notFound()),
    ]);

    const { rates } = await fetchExchangeRatesGrpc(api, [
      { exchangeRatesId: RATES_TABLE, epoch: 1 },
      { exchangeRatesId: RATES_TABLE, epoch: 2 },
    ]);

    expect(rates[0]?.sui_amount).toBe("9");
    expect(rates[1]).toBeNull();
  });

  it("treats a non-numeric rate value as a failure", async () => {
    const { api } = stubRates(() => [found(fieldJson(1, "not-a-number", "5"))]);

    const { rates, missing } = await fetchExchangeRatesGrpc(api, [
      { exchangeRatesId: RATES_TABLE, epoch: 1 },
    ]);

    expect(rates).toEqual([null]);
    expect(missing).toBe(1);
  });

  it("makes no call at all for an empty lookup list", async () => {
    const { api, batchGetObjects } = stubRates(() => []);

    await expect(fetchExchangeRatesGrpc(api, [])).resolves.toEqual({
      rates: [],
      missing: 0,
      chunksFailed: 0,
    });
    expect(batchGetObjects).not.toHaveBeenCalled();
  });
});
