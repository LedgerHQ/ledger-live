import { OpKind } from "@taquito/rpc";
import { getPkhfromPk } from "@taquito/utils";
import coinConfig from "../config";
import { UnsupportedOperationKind } from "../types/errors";
import { craftRawOperations } from "./craftRawOperations";
import { getTezosToolkit } from "./tezosToolkit";

jest.mock("./tezosToolkit");
jest.mock("../config", () => ({
  getCoinConfig: jest.fn(),
}));
// Keep real validatePublicKey/normalize, override only the pkh derivation so we can
// pair an arbitrary valid edpk with our test sender in the reveal path.
jest.mock("@taquito/utils", () => ({
  ...jest.requireActual("@taquito/utils"),
  getPkhfromPk: jest.fn(),
}));

// Real, valid Tezos addresses — validateOperation rejects malformed ones.
const SENDER = "tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx";
const RECIPIENT = "tz2TaTpo31sAiX2HBJUTLLdUnqVJR4QjLy1V";
const CONTRACT = "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU";
const BAKER = "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D";
// A valid ed25519 public key (edpk…) so normalizePublicKeyForAddress/validatePublicKey accept it.
const PUBLIC_KEY = "edpkuBknW28nW72KG6RoHtYW7p12T6GKc7nAbwYX5m8Wd9sDVC9yav";

describe("craftRawOperations", () => {
  const mockTezosToolkit = {
    rpc: {
      getManagerKey: jest.fn(),
      getBlock: jest.fn(),
      forgeOperations: jest.fn(),
    },
    estimate: {
      batch: jest.fn(),
      reveal: jest.fn(),
    },
    setProvider: jest.fn(),
  };

  // Helper: the OperationContents[] that were forged in this call.
  const forgedContents = () => {
    expect(mockTezosToolkit.rpc.forgeOperations).toHaveBeenCalled();
    return mockTezosToolkit.rpc.forgeOperations.mock.calls[0][0].contents;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getTezosToolkit as jest.Mock).mockReturnValue(mockTezosToolkit);
    mockTezosToolkit.rpc.getBlock.mockResolvedValue({ hash: "BLockHash" });
    mockTezosToolkit.rpc.forgeOperations.mockResolvedValue("deadbeef");
    // Default: account already revealed (no leading reveal op).
    mockTezosToolkit.rpc.getManagerKey.mockResolvedValue(PUBLIC_KEY);
    // One estimate per operation (1:1 with the params passed to estimate.batch).
    mockTezosToolkit.estimate.batch.mockResolvedValue([
      { suggestedFeeMutez: 500, gasLimit: 1400, storageLimit: 0 },
    ]);
    (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
      fees: { minFees: 100, minRevealGasLimit: 0, minStorageLimit: 0 },
    });
  });

  it("forges a plain transfer, estimating the missing limits", async () => {
    const ops = [{ kind: "transaction", destination: RECIPIENT, amount: "1000" }];

    const result = await craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, 5n);

    expect(result).toBe("03deadbeef"); // 0x03 watermark + forged bytes
    expect(mockTezosToolkit.estimate.batch).toHaveBeenCalledWith([
      { kind: OpKind.TRANSACTION, source: SENDER, to: RECIPIENT, amount: 1000, mutez: true },
    ]);
    expect(forgedContents()).toEqual([
      {
        kind: OpKind.TRANSACTION,
        source: SENDER,
        destination: RECIPIENT,
        amount: "1000",
        counter: "5",
        fee: "500",
        gas_limit: "1400",
        storage_limit: "0",
      },
    ]);
  });

  it("forges a contract call, passing the entrypoint/parameters to the estimate and contents", async () => {
    const parameters = { entrypoint: "transfer", value: { prim: "Unit" } };
    const ops = [{ kind: "transaction", destination: CONTRACT, amount: "0", parameters }];

    await craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, 7n);

    expect(mockTezosToolkit.estimate.batch).toHaveBeenCalledWith([
      { kind: OpKind.TRANSACTION, source: SENDER, to: CONTRACT, amount: 0, mutez: true, parameter: parameters },
    ]);
    expect(forgedContents()[0]).toMatchObject({
      kind: OpKind.TRANSACTION,
      destination: CONTRACT,
      counter: "7",
      parameters,
    });
  });

  it("forges a delegation", async () => {
    mockTezosToolkit.estimate.batch.mockResolvedValue([
      { suggestedFeeMutez: 400, gasLimit: 1000, storageLimit: 0 },
    ]);
    const ops = [{ kind: "delegation", delegate: BAKER }];

    await craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, 3n);

    expect(mockTezosToolkit.estimate.batch).toHaveBeenCalledWith([
      { kind: OpKind.DELEGATION, source: SENDER, delegate: BAKER },
    ]);
    expect(forgedContents()).toEqual([
      {
        kind: OpKind.DELEGATION,
        source: SENDER,
        counter: "3",
        fee: "400",
        gas_limit: "1000",
        storage_limit: "0",
        delegate: BAKER,
      },
    ]);
  });

  it("forges a multi-op batch with sequential counters from a single batch estimate", async () => {
    mockTezosToolkit.estimate.batch.mockResolvedValue([
      { suggestedFeeMutez: 500, gasLimit: 1400, storageLimit: 0 },
      { suggestedFeeMutez: 900, gasLimit: 5000, storageLimit: 10 },
    ]);
    const ops = [
      { kind: "transaction", destination: RECIPIENT, amount: "10" },
      { kind: "transaction", destination: CONTRACT, amount: "0", parameters: { entrypoint: "foo", value: { prim: "Unit" } } },
    ];

    await craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, 9n);

    expect(mockTezosToolkit.estimate.batch).toHaveBeenCalledTimes(1);
    const contents = forgedContents();
    expect(contents).toHaveLength(2);
    expect(contents[0].counter).toBe("9");
    expect(contents[1]).toMatchObject({ counter: "10", gas_limit: "5000", storage_limit: "10" });
  });

  it("uses the trailing op estimate when a reveal estimate is prepended for an unrevealed source", async () => {
    mockTezosToolkit.rpc.getManagerKey.mockResolvedValue(null);
    (getPkhfromPk as jest.Mock).mockReturnValue(SENDER);
    mockTezosToolkit.estimate.reveal.mockResolvedValue({
      suggestedFeeMutez: 374,
      gasLimit: 1000,
      storageLimit: 0,
    });
    // batch returns [reveal, op]; the leading reveal estimate is dropped, op uses the trailing one.
    mockTezosToolkit.estimate.batch.mockResolvedValue([
      { suggestedFeeMutez: 374, gasLimit: 1000, storageLimit: 0 },
      { suggestedFeeMutez: 800, gasLimit: 2000, storageLimit: 5 },
    ]);
    const ops = [{ kind: "transaction", destination: RECIPIENT, amount: "1000" }];

    await craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, 5n);

    const contents = forgedContents();
    expect(contents[0].kind).toBe(OpKind.REVEAL);
    expect(contents[1]).toMatchObject({
      kind: OpKind.TRANSACTION,
      fee: "800",
      gas_limit: "2000",
      storage_limit: "5",
    });
  });

  it("throws when the batch estimate count doesn't match (revealed source, extra estimate)", async () => {
    // Revealed source ⇒ expect exactly N estimates; N+1 is a contract violation, not a silent slice.
    mockTezosToolkit.estimate.batch.mockResolvedValue([
      { suggestedFeeMutez: 374, gasLimit: 1000, storageLimit: 0 },
      { suggestedFeeMutez: 800, gasLimit: 2000, storageLimit: 5 },
    ]);
    const ops = [{ kind: "transaction", destination: RECIPIENT, amount: "1000" }];

    await expect(
      craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, 5n),
    ).rejects.toThrow("expected 1 estimate(s)");
  });

  it("honours caller-provided fee/gas/storage without estimating", async () => {
    const ops = [
      {
        kind: "transaction",
        destination: RECIPIENT,
        amount: "1000",
        fee: "1234",
        gas_limit: "2000",
        storage_limit: "10",
      },
    ];

    await craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, 5n);

    expect(mockTezosToolkit.estimate.batch).not.toHaveBeenCalled();
    expect(forgedContents()[0]).toMatchObject({ fee: "1234", gas_limit: "2000", storage_limit: "10" });
  });

  it("prepends a reveal when the sender is not revealed", async () => {
    mockTezosToolkit.rpc.getManagerKey.mockResolvedValue(null);
    (getPkhfromPk as jest.Mock).mockReturnValue(SENDER);
    mockTezosToolkit.estimate.reveal.mockResolvedValue({
      suggestedFeeMutez: 374,
      gasLimit: 1000,
      storageLimit: 0,
    });

    const ops = [{ kind: "transaction", destination: RECIPIENT, amount: "1000" }];

    await craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, 5n);

    const contents = forgedContents();
    expect(contents).toHaveLength(2);
    expect(contents[0]).toMatchObject({
      kind: OpKind.REVEAL,
      source: SENDER,
      counter: "5",
      public_key: PUBLIC_KEY,
    });
    expect(contents[1]).toMatchObject({ kind: OpKind.TRANSACTION, counter: "6" });
  });

  it("falls back to SDK reveal helpers when estimate.reveal throws", async () => {
    mockTezosToolkit.rpc.getManagerKey.mockResolvedValue(null);
    (getPkhfromPk as jest.Mock).mockReturnValue(SENDER);
    mockTezosToolkit.estimate.reveal.mockRejectedValue(new Error("inconsistent_hash"));

    const ops = [{ kind: "transaction", destination: RECIPIENT, amount: "1000" }];

    await craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, 5n);

    const reveal = forgedContents()[0];
    expect(reveal.kind).toBe(OpKind.REVEAL);
    // Reveal limits came from the SDK fallback (getRevealFee/getRevealGasLimit), not a thrown error.
    expect(reveal.fee).toMatch(/^\d+$/);
    expect(reveal.gas_limit).toMatch(/^\d+$/);
  });

  it("rejects a reveal whose public key does not match the sender", async () => {
    mockTezosToolkit.rpc.getManagerKey.mockResolvedValue(null);
    (getPkhfromPk as jest.Mock).mockReturnValue("tz1someoneElse");

    const ops = [{ kind: "transaction", destination: RECIPIENT, amount: "1000" }];

    await expect(
      craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, 5n),
    ).rejects.toThrow("does not match the sender");
  });

  it("throws on an unsupported operation kind", async () => {
    const ops = [{ kind: "origination", balance: "0" }];

    await expect(
      craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, 5n),
    ).rejects.toBeInstanceOf(UnsupportedOperationKind);
  });

  describe("input validation", () => {
    it("throws on malformed JSON or an empty array", async () => {
      await expect(craftRawOperations("not-json", SENDER, PUBLIC_KEY, 5n)).rejects.toThrow(
        "must be a JSON array",
      );
      await expect(craftRawOperations("[]", SENDER, PUBLIC_KEY, 5n)).rejects.toThrow(
        "non-empty array",
      );
    });

    it("throws on a non-integer amount", async () => {
      const ops = [{ kind: "transaction", destination: RECIPIENT, amount: "1.5" }];
      await expect(
        craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, 5n),
      ).rejects.toThrow("`amount` must be a non-negative integer string");
    });

    it("throws on a missing or invalid destination", async () => {
      await expect(
        craftRawOperations(JSON.stringify([{ kind: "transaction", amount: "1000" }]), SENDER, PUBLIC_KEY, 5n),
      ).rejects.toThrow("valid `destination`");
      await expect(
        craftRawOperations(
          JSON.stringify([{ kind: "transaction", destination: "not-an-address", amount: "1000" }]),
          SENDER,
          PUBLIC_KEY,
          5n,
        ),
      ).rejects.toThrow("valid `destination`");
    });

    it("throws on a non-numeric fee", async () => {
      const ops = [{ kind: "transaction", destination: RECIPIENT, amount: "1000", fee: "abc" }];
      await expect(
        craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, 5n),
      ).rejects.toThrow("`fee` must be a non-negative integer string");
    });

    it("rejects an empty or invalid delegate (must not be treated as undelegation)", async () => {
      await expect(
        craftRawOperations(JSON.stringify([{ kind: "delegation", delegate: "" }]), SENDER, PUBLIC_KEY, 5n),
      ).rejects.toThrow("`delegate` must be a valid implicit account address");
      await expect(
        craftRawOperations(JSON.stringify([{ kind: "delegation", delegate: 123 }]), SENDER, PUBLIC_KEY, 5n),
      ).rejects.toThrow("`delegate` must be a valid implicit account address");
    });

    it("rejects a contract (KT1) delegate (delegates must be implicit accounts)", async () => {
      await expect(
        craftRawOperations(JSON.stringify([{ kind: "delegation", delegate: CONTRACT }]), SENDER, PUBLIC_KEY, 5n),
      ).rejects.toThrow("`delegate` must be a valid implicit account address");
    });

    it("allows a delegation with no delegate (undelegation)", async () => {
      mockTezosToolkit.estimate.batch.mockResolvedValue([
        { suggestedFeeMutez: 400, gasLimit: 1000, storageLimit: 0 },
      ]);
      await craftRawOperations(JSON.stringify([{ kind: "delegation" }]), SENDER, PUBLIC_KEY, 5n);

      const content = forgedContents()[0];
      expect(content.kind).toBe(OpKind.DELEGATION);
      expect(content).not.toHaveProperty("delegate");
    });

    it("throws when the sequence is out of safe integer range", async () => {
      const ops = [{ kind: "transaction", destination: RECIPIENT, amount: "1000" }];
      await expect(
        craftRawOperations(JSON.stringify(ops), SENDER, PUBLIC_KEY, BigInt(Number.MAX_SAFE_INTEGER) + 1n),
      ).rejects.toThrow("out of the safe integer range");
    });

    it("throws on an invalid or contract (KT1) sender address", async () => {
      const ops = [{ kind: "transaction", destination: RECIPIENT, amount: "1000" }];
      await expect(
        craftRawOperations(JSON.stringify(ops), "not-an-address", PUBLIC_KEY, 5n),
      ).rejects.toThrow("`sender` must be a valid implicit account address");
      await expect(
        craftRawOperations(JSON.stringify(ops), CONTRACT, PUBLIC_KEY, 5n),
      ).rejects.toThrow("`sender` must be a valid implicit account address");
    });
  });
});
