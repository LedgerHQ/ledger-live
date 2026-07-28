import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { getBlockDagInfo, getFeeEstimate, getUtxosForAddresses } from "../../network";
import { craftTransaction, UnsignedKaspaTransaction } from "./craftTransaction";

const mockGetUtxosForAddresses = jest.fn();
const mockGetFeeEstimate = jest.fn();
const mockGetBlockDagInfo = jest.fn();
jest.mock("../../network", () => ({
  ...jest.requireActual("../../network"),
  getUtxosForAddresses: (...args: unknown[]) => mockGetUtxosForAddresses(...args),
  getFeeEstimate: (...args: unknown[]) => mockGetFeeEstimate(...args),
  getBlockDagInfo: (...args: unknown[]) => mockGetBlockDagInfo(...args),
}));

const SENDER = "kaspa:qrp78nf43jaz3zk0j4dxga4ncdzk95xhun95hp6scyh6g6z7kwugy02wfw6ee";
const RECIPIENT = "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65";

function utxo(amount: number, index: number) {
  return {
    address: SENDER,
    outpoint: { transactionId: index.toString(16).padStart(64, "0"), index },
    utxoEntry: {
      amount,
      scriptPublicKey: { version: 0, scriptPublicKey: "20" + "0".repeat(64) + "ac" },
      blockDaaScore: (1000 + index).toString(),
      isCoinbase: false,
    },
  };
}

function intent(overrides: Partial<TransactionIntent> = {}): TransactionIntent {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 10_000_000n,
    asset: { type: "native" },
    ...overrides,
  };
}

const FEE_ESTIMATE = {
  priorityBucket: { feerate: 3, estimatedSeconds: 1 },
  normalBuckets: [{ feerate: 1, estimatedSeconds: 10 }],
  lowBuckets: [{ feerate: 1, estimatedSeconds: 60 }],
};

describe("craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFeeEstimate.mockResolvedValue(FEE_ESTIMATE);
    // Return a DAA score high enough that isCoinbase:false UTXOs are always spendable.
    mockGetBlockDagInfo.mockResolvedValue({ virtualDaaScore: "2000000" });
  });

  it("validates the sender address before any network call", async () => {
    await expect(craftTransaction(intent({ sender: "not-a-kaspa-address" }))).rejects.toThrow(
      "invalid sender address",
    );
    expect(mockGetUtxosForAddresses).not.toHaveBeenCalled();
  });

  it("validates the recipient address before any network call", async () => {
    await expect(craftTransaction(intent({ recipient: "not-a-kaspa-address" }))).rejects.toThrow(
      "invalid recipient address",
    );
    expect(mockGetUtxosForAddresses).not.toHaveBeenCalled();
  });

  it("throws when the sender has no spendable UTXOs", async () => {
    mockGetUtxosForAddresses.mockResolvedValue([]);

    await expect(craftTransaction(intent())).rejects.toThrow("no spendable UTXOs");
  });

  it("selects UTXOs covering the amount and produces a change output", async () => {
    // A 2 KAS UTXO sending 1.5 KAS: selects the single input and keeps a change output.
    // Amounts are kept large so the KIP-9 storage mass stays under MASS_LIMIT_PER_TX
    // (a tiny output would inflate storage mass and force the change to be discarded).
    mockGetUtxosForAddresses.mockResolvedValue([utxo(200_000_000, 0)]);

    const crafted = await craftTransaction(intent({ amount: 150_000_000n }));
    const parsed: UnsignedKaspaTransaction = JSON.parse(crafted.transaction);

    expect(parsed.inputs).toHaveLength(1);
    expect(parsed.outputs).toHaveLength(2); // recipient + change
    expect(parsed.outputs[0].value).toBe(150_000_000);
    expect(Number(crafted.details?.fee)).toBeGreaterThan(0);
  });

  it("overrides the estimated fee with the caller-supplied custom fee", async () => {
    mockGetUtxosForAddresses.mockResolvedValue([utxo(200_000_000, 0)]);

    const defaultCraft = await craftTransaction(intent({ amount: 150_000_000n }));
    const defaultFee = BigInt(defaultCraft.details?.fee as string);

    const customFee = defaultFee + 5000n;
    const crafted = await craftTransaction(intent({ amount: 150_000_000n }), { value: customFee });

    expect(crafted.details?.fee).toBe(customFee.toString());
  });

  it("throws when the custom fee exceeds what the selected UTXOs can cover", async () => {
    mockGetUtxosForAddresses.mockResolvedValue([utxo(200_000_000, 0)]);

    await expect(
      craftTransaction(intent({ amount: 150_000_000n }), { value: 999_999_999n }),
    ).rejects.toThrow("custom fee exceeds");
  });

  it("throws when the custom fee is below the mass-based minimum for this transaction", async () => {
    mockGetUtxosForAddresses.mockResolvedValue([utxo(200_000_000, 0)]);

    const defaultCraft = await craftTransaction(intent({ amount: 150_000_000n }));
    const defaultFee = BigInt(defaultCraft.details?.fee as string);

    await expect(
      craftTransaction(intent({ amount: 150_000_000n }), { value: defaultFee - 1n }),
    ).rejects.toThrow("below the minimum required");
  });

  it("throws when the custom fee shrinks the change output into KIP-9 dust", async () => {
    // 200M UTXO sending 150M — default fee ~2036, change ~49,997,964.
    // A custom fee of 49,000,000 reduces change to ~1,000,000 sompi.
    // storageMass(outputs=[150M, 1M]) ≈ 1,001,667 >> MASS_LIMIT_PER_TX (100,000).
    mockGetUtxosForAddresses.mockResolvedValue([utxo(200_000_000, 0)]);

    await expect(
      craftTransaction(intent({ amount: 150_000_000n }), { value: 49_000_000n }),
    ).rejects.toThrow("KIP-9 storage mass");
  });

  it("throws for a non-positive amount", async () => {
    mockGetUtxosForAddresses.mockResolvedValue([utxo(50_000_000, 0)]);

    await expect(craftTransaction(intent({ amount: 0n }))).rejects.toThrow(
      "transaction amount must be positive",
    );
  });

  it("sweeps the max spendable amount for a useAllAmount intent", async () => {
    mockGetUtxosForAddresses.mockResolvedValue([utxo(50_000_000, 0)]);

    const crafted = await craftTransaction(intent({ useAllAmount: true, amount: 0n }));
    const parsed: UnsignedKaspaTransaction = JSON.parse(crafted.transaction);

    // A sweep spends the full UTXO value on the recipient output, leaving no change.
    expect(parsed.outputs).toHaveLength(1);
    expect(parsed.outputs[0].value).toBeLessThan(50_000_000);
    expect(parsed.outputs[0].value).toBeGreaterThan(0);
  });
});
