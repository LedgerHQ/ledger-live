import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "../../../types";
import type { SignerContext } from "../../../signer";
import type { ZcashTransferType } from "../types";
import { getChainAdapter } from "../../registry";

// Load the zcash adapter (side-effect registration)
import "../index";

// ── Helpers ────────────────────────────────────────────────────────────

const mockAccount = { currency: { id: "zcash" } } as unknown as Account;
const mockSignerContext = jest.fn() as unknown as SignerContext;

function makeTx(transferType: ZcashTransferType): Transaction {
  return {
    family: "bitcoin",
    amount: 0 as unknown as Transaction["amount"],
    recipient: "",
    useAllAmount: false,
    feePerByte: null,
    networkInfo: null,
    utxoStrategy: { strategy: 0, excludeUTXOs: [] },
    rbf: false,
    transferType,
  } as unknown as Transaction;
}

// ── Tests ──────────────────────────────────────────────────────────────
// All Zcash transactions (transparent + shielded) will use PCZT.
// Until PCZT is implemented, every method returns undefined (falls back to Bitcoin legacy path).

describe("zcash chain adapter — transaction routing", () => {
  const adapter = getChainAdapter("zcash");

  const allTransferTypes: ZcashTransferType[] = [
    "transparent",
    "transparent-to-shielded",
    "shielded-to-transparent",
    "shielded",
  ];

  describe("signOperation", () => {
    it.each<ZcashTransferType>(allTransferTypes)(
      "returns undefined for %s transactions (PCZT not yet implemented)",
      transferType => {
        const result = adapter.signOperation!(
          mockAccount,
          "device",
          makeTx(transferType),
          mockSignerContext,
        );
        expect(result).toBeUndefined();
      },
    );
  });

  describe("getTransactionStatus", () => {
    it.each<ZcashTransferType>(allTransferTypes)(
      "returns undefined for %s transactions (PCZT not yet implemented)",
      transferType => {
        const result = adapter.getTransactionStatus!(mockAccount, makeTx(transferType));
        expect(result).toBeUndefined();
      },
    );
  });

  describe("estimateMaxSpendable", () => {
    it.each<ZcashTransferType>(allTransferTypes)(
      "returns undefined for %s transactions (PCZT not yet implemented)",
      transferType => {
        const result = adapter.estimateMaxSpendable!(mockAccount, undefined, makeTx(transferType));
        expect(result).toBeUndefined();
      },
    );

    it("returns undefined when transaction is null", () => {
      const result = adapter.estimateMaxSpendable!(mockAccount, undefined, null as unknown as Transaction);
      expect(result).toBeUndefined();
    });
  });

  describe("prepareTransaction", () => {
    it.each<ZcashTransferType>(allTransferTypes)(
      "returns undefined for %s transactions (PCZT not yet implemented)",
      transferType => {
        const result = adapter.prepareTransaction!(mockAccount, makeTx(transferType));
        expect(result).toBeUndefined();
      },
    );
  });
});
