import { encode, decode } from "ripple-binary-codec";
import { SignerEntry } from "../types";
import { craftRawTransaction } from "./craftRawTransaction";

// --- Mocks ---
const mockEstimateFees = jest.fn();
const mockGetLedgerIndex = jest.fn();

jest.mock("./estimateFees", () => ({
  estimateFees: () => mockEstimateFees(),
}));

jest.mock("../network", () => ({
  getLedgerIndex: () => mockGetLedgerIndex(),
}));

// Mock ripple-address-codec globally so ordering logic in sortSignersByNumericAddress uses deterministic data.
const decodeAccountIDMock = jest.fn((account: string) => {
  const bytes = new Uint8Array(20).fill(0);
  const ordering: Record<string, number> = { alpha: 1, beta: 2, gamma: 3, delta: 4 };
  if (ordering[account]) bytes[19] = ordering[account];
  return bytes;
});
jest.mock("ripple-address-codec", () => ({
  decodeAccountID: (addr: string) => decodeAccountIDMock(addr),
  isValidClassicAddress: () => true,
}));

describe("craftRawTransaction", () => {
  const sender = "rPDf6SQStnNmw1knCu1ei7h6BcDAEUUqn5";
  const destination = "rJe1St1G6BWMFmdrrcT7NdD3XT1NxTMEWN";
  // XRPL Ed25519 public keys must be 33 bytes: 0xED prefix + 32 bytes payload (66 hex chars total)
  // Using a deterministic dummy key so ripple-binary-codec encode/decode roundtrips without alteration.
  const publicKey = "ED0123456789ABCDEFFEDCBA98765432100123456789ABCDEFFEDCBA9876543211"; // 66 hex chars
  // Pre-set key used in the test that ensures existing SigningPubKey is preserved.
  const alreadySetPublicKey = "EDFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"; // 66 hex chars

  beforeEach(() => {
    mockEstimateFees.mockReset();
    mockGetLedgerIndex.mockReset();
  });

  // Helper to safely extract Signers array without relying on type assertions elsewhere
  function getSigners(obj: unknown): SignerEntry[] | undefined {
    if (!obj || typeof obj !== "object") return undefined;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const potential = (obj as { Signers?: unknown }).Signers;
    if (Array.isArray(potential)) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return potential as SignerEntry[];
    }
    return undefined;
  }

  it("fills missing Fee, Sequence, LastLedgerSequence & SigningPubKey for a standard payment", async () => {
    // Given: base transaction missing common autofill fields
    const baseTx = {
      TransactionType: "Payment",
      Account: sender,
      Amount: "1000",
      Destination: destination,
    } as const;
    const serialized = encode(baseTx);

    mockEstimateFees.mockResolvedValue({ fees: BigInt(123) });
    mockGetLedgerIndex.mockResolvedValue(1000);

    // When
    const result = await craftRawTransaction(serialized, sender, publicKey, 10n);

    // Then
    const decoded = decode(result.transaction);
    expect(decoded).toMatchObject({
      TransactionType: "Payment",
      Account: sender,
      Amount: "1000",
      Destination: destination,
      Fee: "123",
      Sequence: 10,
      LastLedgerSequence: 1020, // 1000 + 20 offset
      SigningPubKey: publicKey,
    });
    expect(mockEstimateFees).toHaveBeenCalledTimes(1);
    expect(mockGetLedgerIndex).toHaveBeenCalledTimes(1);
  });

  it("autofills only missing Fee & LastLedgerSequence when Sequence provided", async () => {
    // Given: Sequence present; Fee, LastLedgerSequence & SigningPubKey missing
    const baseTx = {
      TransactionType: "Payment",
      Account: sender,
      Amount: "1234",
      Destination: destination,
      Sequence: 77,
    } as const;
    const serialized = encode(baseTx);

    mockEstimateFees.mockResolvedValue({ fees: BigInt(456) });
    mockGetLedgerIndex.mockResolvedValue(2000);

    // When: pass a different sequence param to ensure existing Sequence is not overwritten
    const result = await craftRawTransaction(serialized, sender, publicKey, 999n);

    // Then
    const decoded = decode(result.transaction);
    expect(decoded.Sequence).toBe(77); // preserved
    expect(decoded.Fee).toBe("456"); // autofilled
    expect(decoded.LastLedgerSequence).toBe(2020); // 2000 + 20
    expect(decoded.SigningPubKey).toBe(publicKey); // autofilled
    expect(mockEstimateFees).toHaveBeenCalledTimes(1);
    expect(mockGetLedgerIndex).toHaveBeenCalledTimes(1);
  });

  it("does not overwrite provided Fee / Sequence / LastLedgerSequence / SigningPubKey", async () => {
    // Given
    const baseTx = {
      TransactionType: "Payment",
      Account: sender,
      Amount: "2500",
      Destination: destination,
      Fee: "999",
      Sequence: 42,
      LastLedgerSequence: 5000,
      SigningPubKey: alreadySetPublicKey,
    } as const;
    const serialized = encode(baseTx);

    // Mocks would be used if fields missing; ensure they are ignored
    mockEstimateFees.mockResolvedValue({ fees: BigInt(1) });
    mockGetLedgerIndex.mockResolvedValue(1);

    // When
    const result = await craftRawTransaction(serialized, sender, publicKey, 999n);

    // Then
    const decoded = decode(result.transaction);
    expect(decoded.Fee).toBe("999");
    expect(decoded.Sequence).toBe(42);
    expect(decoded.LastLedgerSequence).toBe(5000);
    expect(decoded.SigningPubKey).toBe(alreadySetPublicKey);
    expect(mockEstimateFees).not.toHaveBeenCalled();
    expect(mockGetLedgerIndex).not.toHaveBeenCalled();
  });

  it("sets Sequence to 0 when TicketSequence is provided and Sequence missing", async () => {
    // Given
    const baseTx = {
      TransactionType: "Payment",
      Account: sender,
      Amount: "1",
      Destination: destination,
      TicketSequence: 555,
      Fee: "10",
      // Sequence intentionally omitted
    } as const;
    const serialized = encode(baseTx);

    mockGetLedgerIndex.mockResolvedValue(10);

    // When
    const result = await craftRawTransaction(serialized, sender, publicKey, 77n);

    // Then
    const decoded = decode(result.transaction);
    expect(decoded.TicketSequence).toBe(555);
    expect(decoded.Sequence).toBe(0);
    expect(decoded.LastLedgerSequence).toBe(30); // 10 + 20
  });

  it("forces Sequence to 0 when TicketSequence present even if non-zero Sequence provided", async () => {
    // Given: TicketSequence provided AND a non-zero Sequence already set (we enforce spec by overriding)
    const baseTx = {
      TransactionType: "Payment",
      Account: sender,
      Amount: "123",
      Destination: destination,
      TicketSequence: 777,
      Sequence: 55, // non-zero pre-set
      Fee: "10",
    } as const;
    const serialized = encode(baseTx);

    mockGetLedgerIndex.mockResolvedValue(111);

    // When
    const result = await craftRawTransaction(serialized, sender, publicKey, 9999n);

    // Then
    const decoded = decode(result.transaction);
    expect(decoded.Sequence).toBe(0); // overridden to comply with spec
    expect(decoded.TicketSequence).toBe(777);
    expect(decoded.LastLedgerSequence).toBe(131); // 111 + 20
  });

  it("throws when sender does not match Account for standard transaction", async () => {
    // Given
    const baseTx = {
      TransactionType: "Payment",
      Account: sender,
      Amount: "10",
      Destination: destination,
    } as const;
    const serialized = encode(baseTx);

    // When & Then
    await expect(craftRawTransaction(serialized, "rOTHERADDRESS", publicKey, 1n)).rejects.toThrow(
      "Sender address does not match the transaction account",
    );
  });

  describe("multi-sign", () => {
    it("adds a Signers array when absent (single existing signer)", async () => {
      // Given: multi-sign transaction (SigningPubKey empty) with required Fee & Sequence
      const multi = {
        TransactionType: "Payment",
        Account: sender, // Account can differ from signer in multi-sign, we keep same for simplicity
        Amount: "100",
        Destination: destination,
        SigningPubKey: "", // signals multi-sign
        Fee: "500",
        Sequence: 9,
      } as const;
      const serialized = encode(multi);

      // When
      const result = await craftRawTransaction(serialized, sender, publicKey, 9n);

      // Then
      const decoded = decode(result.transaction);
      const signers = getSigners(decoded);
      expect(signers?.length).toBe(1);
      if (signers && signers[0]) {
        expect(signers[0]).toMatchObject({
          Signer: { Account: sender, SigningPubKey: publicKey, TxnSignature: "" },
        });
      }
      // No autofill of LastLedgerSequence in multi-sign path (not required for this assertion)
    });

    it("does not add LastLedgerSequence for multi-sign when absent", async () => {
      // Given: multi-sign tx w/o LastLedgerSequence
      const multi = {
        TransactionType: "Payment",
        Account: sender,
        Amount: "50",
        Destination: destination,
        SigningPubKey: "", // multi-sign
        Fee: "12",
        Sequence: 2,
      } as const;
      const serialized = encode(multi);
      mockGetLedgerIndex.mockResolvedValue(500); // should NOT be used

      // When
      const result = await craftRawTransaction(serialized, sender, publicKey, 2n);

      // Then
      const decoded = decode(result.transaction);
      expect(decoded.LastLedgerSequence).toBeUndefined();
    });

    it("appends signer and sorts existing Signers numerically", async () => {
      // Given existing unsorted signers
      const existing: SignerEntry[] = [
        {
          Signer: {
            Account: "rPDf6SQStnNmw1knCu1ei7h6BcDAEUUqn5",
            SigningPubKey: "K3",
            TxnSignature: "",
          },
        },
        {
          Signer: {
            Account: "rJe1St1G6BWMFmdrrcT7NdD3XT1NxTMEWN",
            SigningPubKey: "K1",
            TxnSignature: "",
          },
        },
        {
          Signer: {
            Account: "rDKsbvy9uaNpPtvVFraJyNGfjvTw8xivgK",
            SigningPubKey: "K4",
            TxnSignature: "",
          },
        },
      ];
      const multi: {
        TransactionType: string;
        Account: string;
        Amount: string;
        Destination: string;
        SigningPubKey: string;
        Fee: string;
        Sequence: number;
        Signers: SignerEntry[];
      } = {
        TransactionType: "Payment",
        Account: sender,
        Amount: "200",
        Destination: destination,
        SigningPubKey: "",
        Fee: "700",
        Sequence: 3,
        Signers: existing,
      };
      const serialized = encode(multi);

      // When
      const result = await craftRawTransaction(
        serialized,
        "r94uo44ukDHWVjYDJLZJYwDdZjo1F2QYgq",
        publicKey,
        3n,
      );

      // Then
      const decoded = decode(result.transaction);
      const signers = getSigners(decoded) ?? [];
      const accounts = signers.map(s => s.Signer.Account);
      expect(accounts).toEqual([
        "rPDf6SQStnNmw1knCu1ei7h6BcDAEUUqn5",
        "rJe1St1G6BWMFmdrrcT7NdD3XT1NxTMEWN",
        "rDKsbvy9uaNpPtvVFraJyNGfjvTw8xivgK",
        "r94uo44ukDHWVjYDJLZJYwDdZjo1F2QYgq",
      ]);
      const betaEntry = signers.find(
        s => s.Signer.Account === "r94uo44ukDHWVjYDJLZJYwDdZjo1F2QYgq",
      );
      expect(betaEntry?.Signer.SigningPubKey).toBe(publicKey);
    });

    it("throws when Fee missing for multi-sign", async () => {
      const multi = {
        TransactionType: "Payment",
        Account: sender,
        Amount: "10",
        Destination: destination,
        SigningPubKey: "",
        Sequence: 1,
      } as const;
      const serialized = encode(multi);
      await expect(craftRawTransaction(serialized, sender, publicKey, 1n)).rejects.toThrow(
        "Fee is required for multi sign transactions",
      );
    });

    it("throws when Sequence missing for multi-sign", async () => {
      const multi = {
        TransactionType: "Payment",
        Account: sender,
        Amount: "10",
        Destination: destination,
        SigningPubKey: "",
        Fee: "1",
      } as const;
      const serialized = encode(multi);
      await expect(craftRawTransaction(serialized, sender, publicKey, 1n)).rejects.toThrow(
        "Sequence is required for multi sign transactions",
      );
    });
  });
});
