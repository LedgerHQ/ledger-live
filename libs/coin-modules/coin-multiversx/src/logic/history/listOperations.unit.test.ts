import { listOperations } from "./listOperations";
import type { MultiversXNetworkApi } from "../../network/api";

const ADDR = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

const TX_STUB = {
  txHash: "abc123",
  sender: ADDR,
  receiver: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l",
  value: "1000000000000000000",
  fee: "50000000000000",
  round: 100,
  timestamp: 1700000000,
  gasLimit: 50000,
  status: "success",
  mode: "send" as const,
};

function makeApi(overrides: Partial<MultiversXNetworkApi> = {}): MultiversXNetworkApi {
  return {
    getHistory: jest.fn().mockResolvedValue([TX_STUB]),
    getESDTTokensForAddress: jest.fn().mockResolvedValue([]),
    getESDTTransactionsForAddress: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as MultiversXNetworkApi;
}

describe("listOperations", () => {
  it("returns native OUT operation for sender", async () => {
    const api = makeApi();
    const result = await listOperations(api, ADDR, { minHeight: 0 });

    expect(result.items).toHaveLength(1);
    const op = result.items[0];
    expect(op.type).toBe("OUT");
    expect(op.tx.hash).toBe("abc123");
    expect(op.asset.type).toBe("native");
  });

  it("OUT value excludes the fee (adapter re-adds it)", async () => {
    const api = makeApi();
    const result = await listOperations(api, ADDR, { minHeight: 0 });

    const op = result.items[0];
    expect(op.type).toBe("OUT");
    // value = tx.value only (1e18), NOT value + fee
    expect(op.value).toBe(1000000000000000000n);
    expect(op.tx.fees).toBe(50000000000000n);
  });

  it("self-send OUT carries a zero value (only the fee is spent)", async () => {
    const api = makeApi({
      getHistory: jest.fn().mockResolvedValue([{ ...TX_STUB, receiver: ADDR }]),
    });
    const result = await listOperations(api, ADDR, { minHeight: 0 });

    expect(result.items[0].value).toBe(0n);
  });

  it("delegate op value excludes the fee (principal surfaced via details)", async () => {
    const DELEGATE_TX = {
      ...TX_STUB,
      txHash: "deleg01",
      mode: "delegate" as const,
      action: { category: "stake", name: "delegate" },
    };
    const api = makeApi({ getHistory: jest.fn().mockResolvedValue([DELEGATE_TX]) });
    const result = await listOperations(api, ADDR, { minHeight: 0 });

    const op = result.items[0];
    expect(op.type).toBe("DELEGATE");
    expect(op.value).toBe(0n);
  });

  it("ESDT native leg (FEES) carries value 0 even when the API tags it action.category=stake", async () => {
    // Some API responses categorize a token transfer as {category:"stake", name:"transfer"};
    // the sender's native leg is a FEES op whose fee the adapter re-adds, so value must be 0.
    const esdtNativeLeg = {
      ...TX_STUB,
      txHash: "esdt-native-leg",
      transfer: "esdt",
      action: { category: "stake", name: "transfer" },
    };
    const api = makeApi({ getHistory: jest.fn().mockResolvedValue([esdtNativeLeg]) });
    const result = await listOperations(api, ADDR, { minHeight: 0 });

    const op = result.items[0];
    expect(op.type).toBe("FEES");
    expect(op.value).toBe(0n);
  });

  // Pins the fee-exclusion contract with generic-coin-framework's adapter (utils.ts),
  // which re-adds tx.fees to OUT/FEES/DELEGATE/UNDELEGATE ops.
  describe("fee-exclusion contract (adapter re-adds fee for OUT/FEES/DELEGATE/UNDELEGATE)", () => {
    const VALUE = "1000000000000000000";
    const FEE = "50000000000000";
    const base = { ...TX_STUB, value: VALUE, fee: FEE };

    async function opFor(tx: object, queryAddr = ADDR) {
      const api = makeApi({ getHistory: jest.fn().mockResolvedValue([tx]) });
      const result = await listOperations(api, queryAddr, { minHeight: 0 });
      return result.items[0];
    }

    it("OUT excludes the fee (value = tx.value)", async () => {
      const op = await opFor(base);
      expect(op.type).toBe("OUT");
      expect(op.value).toBe(1000000000000000000n);
    });

    it("FEES (ESDT native leg) is zero", async () => {
      const op = await opFor({ ...base, transfer: "esdt" });
      expect(op.type).toBe("FEES");
      expect(op.value).toBe(0n);
    });

    it("DELEGATE excludes the fee (value = 0, principal in details)", async () => {
      const op = await opFor({ ...base, action: { category: "stake", name: "delegate" } });
      expect(op.type).toBe("DELEGATE");
      expect(op.value).toBe(0n);
    });

    it("UNDELEGATE excludes the fee (value = 0)", async () => {
      const op = await opFor({ ...base, action: { category: "stake", name: "unDelegate" } });
      expect(op.type).toBe("UNDELEGATE");
      expect(op.value).toBe(0n);
    });

    it("IN keeps the full received value (adapter does not re-add fee)", async () => {
      const recipient = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";
      const op = await opFor({ ...base, sender: ADDR, receiver: recipient }, recipient);
      expect(op.type).toBe("IN");
      expect(op.value).toBe(1000000000000000000n);
    });
  });

  it("returns IN operation for recipient", async () => {
    const recipientAddr = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";
    const api = makeApi({
      getHistory: jest
        .fn()
        .mockResolvedValue([{ ...TX_STUB, sender: ADDR, receiver: recipientAddr }]),
    });
    const result = await listOperations(api, recipientAddr, { minHeight: 0 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("IN");
  });

  it("assigns unique operation ids", async () => {
    const api = makeApi({
      getHistory: jest.fn().mockResolvedValue([TX_STUB, { ...TX_STUB, txHash: "def456" }]),
    });
    const result = await listOperations(api, ADDR, { minHeight: 0 });

    const ids = result.items.map(op => op.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(result.items.length);
  });

  it("falls back to startAt=0 for a non-numeric cursor (no after=NaN)", async () => {
    const getHistory = jest.fn().mockResolvedValue([]);
    const api = makeApi({ getHistory });
    await listOperations(api, ADDR, { cursor: "not-a-number" } as never);

    // getHistory receives a numeric startAt (0), never NaN
    const startAtArg = getHistory.mock.calls[0][1];
    expect(Number.isNaN(startAtArg)).toBe(false);
    expect(startAtArg).toBe(0);
  });

  it("filters out operations below minHeight", async () => {
    const api = makeApi({
      getHistory: jest.fn().mockResolvedValue([
        { ...TX_STUB, txHash: "old", round: 50 },
        { ...TX_STUB, txHash: "new", round: 150 },
      ]),
    });
    const result = await listOperations(api, ADDR, { minHeight: 100 });

    expect(result.items.map(o => o.tx.hash)).toEqual(["new"]);
  });

  it("propagates a network error instead of swallowing it", async () => {
    const api = makeApi({
      getHistory: jest.fn().mockRejectedValue(new Error("gateway 500")),
    });
    await expect(listOperations(api, ADDR, { minHeight: 0 })).rejects.toThrow("gateway 500");
  });

  it("propagates a per-token history error", async () => {
    const api = makeApi({
      getESDTTokensForAddress: jest.fn().mockResolvedValue([{ identifier: "USDC-c76f1f" }]),
      getESDTTransactionsForAddress: jest.fn().mockRejectedValue(new Error("token history down")),
    });
    await expect(listOperations(api, ADDR, { minHeight: 0 })).rejects.toThrow("token history down");
  });

  it("decodes the unbonded amount for an unDelegate operation (details.amount)", async () => {
    const UNDELEG = {
      ...TX_STUB,
      txHash: "undeleg1",
      value: "0",
      action: { category: "stake", name: "unDelegate" },
      // base64 of "unDelegate@0de0b6b3a7640000" (1 EGLD in hex)
      data: Buffer.from("unDelegate@0de0b6b3a7640000").toString("base64"),
    };
    const api = makeApi({ getHistory: jest.fn().mockResolvedValue([UNDELEG]) });
    const op = (await listOperations(api, ADDR, { minHeight: 0 })).items[0];

    expect(op.type).toBe("UNDELEGATE");
    expect(op.value).toBe(0n); // fee-excluded
    expect(op.details?.amount).toBe("1000000000000000000");
  });

  it("computes a claimRewards operation value as reward minus fee", async () => {
    const POOL = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";
    const CLAIM = {
      ...TX_STUB,
      txHash: "claim1",
      receiver: POOL,
      value: "0",
      fee: "10",
      action: { category: "stake", name: "claimRewards" },
      operations: [
        { action: "transfer", type: "egld", sender: POOL, receiver: ADDR, value: "500" },
      ],
    };
    const api = makeApi({ getHistory: jest.fn().mockResolvedValue([CLAIM]) });
    const op = (await listOperations(api, ADDR, { minHeight: 0 })).items[0];

    expect(op.type).toBe("REWARD");
    expect(op.value).toBe(490n); // 500 reward - 10 fee
  });

  it("reads the matching leg value for an ESDT swap operation", async () => {
    const SWAP = {
      ...TX_STUB,
      txHash: "swap1",
      transfer: "esdt",
      action: {
        name: "swap",
        arguments: {
          transfers: [
            { token: "USDC-c76f1f", value: "100" },
            { token: "WEGLD-bd4d79", value: "200" },
          ],
        },
      },
    };
    const api = makeApi({
      getESDTTokensForAddress: jest.fn().mockResolvedValue([{ identifier: "WEGLD-bd4d79" }]),
      getESDTTransactionsForAddress: jest.fn().mockResolvedValue([SWAP]),
      getHistory: jest.fn().mockResolvedValue([]),
    });
    const esdtOp = (await listOperations(api, ADDR, { minHeight: 0 })).items.find(
      o => o.asset.type === "esdt",
    );
    expect(esdtOp?.value).toBe(200n); // WEGLD leg matches the queried token
  });

  it("returns empty page for account with no history", async () => {
    const api = makeApi({
      getHistory: jest.fn().mockResolvedValue([]),
    });
    const result = await listOperations(api, ADDR, { minHeight: 0 });

    expect(result.items).toHaveLength(0);
    expect(result.next).toBeUndefined();
  });

  it("returns native + ESDT ops merged in chronological order (default desc, honors order)", async () => {
    // native op is older than the ESDT op; without sorting the native op would
    // come first because native ops are appended before ESDT ops.
    const nativeOld = { ...TX_STUB, txHash: "native-old", timestamp: 1000 };
    const esdtNew = {
      ...TX_STUB,
      txHash: "esdt-new",
      timestamp: 2000,
      transfer: "esdt",
      action: {
        name: "transfer",
        arguments: { transfers: [{ token: "USDC-c76f1f", value: "5" }] },
      },
    };
    const opts = {
      getHistory: jest.fn().mockResolvedValue([nativeOld]),
      getESDTTokensForAddress: jest
        .fn()
        .mockResolvedValue([{ identifier: "USDC-c76f1f", balance: "5" }]),
      getESDTTransactionsForAddress: jest.fn().mockResolvedValue([esdtNew]),
    };

    const descResult = await listOperations(makeApi(opts), ADDR, { minHeight: 0 });
    expect(descResult.items.map(o => o.tx.hash)).toEqual(["esdt-new", "native-old"]);

    const ascResult = await listOperations(makeApi(opts), ADDR, {
      minHeight: 0,
      order: "asc",
    } as never);
    expect(ascResult.items.map(o => o.tx.hash)).toEqual(["native-old", "esdt-new"]);
  });

  it("propagates ESDT operations", async () => {
    const ESDT_TX = {
      ...TX_STUB,
      txHash: "esdt001",
      transfer: "esdt",
      tokenIdentifier: "USDC-c76f1f",
      action: {
        category: "stake",
        name: "transfer",
        arguments: { transfers: [{ token: "USDC-c76f1f", value: "100" }] },
      },
    };
    const api = makeApi({
      getESDTTokensForAddress: jest
        .fn()
        .mockResolvedValue([{ identifier: "USDC-c76f1f", name: "USD Coin", balance: "100" }]),
      getESDTTransactionsForAddress: jest.fn().mockResolvedValue([ESDT_TX]),
    });
    const result = await listOperations(api, ADDR, { minHeight: 0 });

    const esdtOps = result.items.filter(op => op.asset.type === "esdt");
    expect(esdtOps).toHaveLength(1);
    expect(esdtOps[0].asset).toMatchObject({ type: "esdt", assetReference: "USDC-c76f1f" });
  });
});
