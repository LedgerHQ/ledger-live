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
    amount: 0 as any,
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

describe("zcash chain adapter — transaction routing", () => {
  const adapter = getChainAdapter("zcash");

  describe("signOperation", () => {
    it("returns undefined for transparent transactions", () => {
      const result = adapter.signOperation!(
        mockAccount,
        "device",
        makeTx("transparent"),
        mockSignerContext,
      );
      expect(result).toBeUndefined();
    });

    it.each<ZcashTransferType>(["transparent-to-shielded", "shielded-to-transparent", "shielded"])(
      "throws for %s transactions (not yet implemented)",
      transferType => {
        expect(() =>
          adapter.signOperation!(mockAccount, "device", makeTx(transferType), mockSignerContext),
        ).toThrow("not yet implemented");
      },
    );
  });

  describe("getTransactionStatus", () => {
    it("returns undefined for transparent transactions", () => {
      const result = adapter.getTransactionStatus!(mockAccount, makeTx("transparent"));
      expect(result).toBeUndefined();
    });

    it.each<ZcashTransferType>(["transparent-to-shielded", "shielded-to-transparent", "shielded"])(
      "throws for %s transactions (not yet implemented)",
      transferType => {
        expect(() => adapter.getTransactionStatus!(mockAccount, makeTx(transferType))).toThrow(
          "not yet implemented",
        );
      },
    );
  });

  describe("estimateMaxSpendable", () => {
    it("returns undefined for transparent transactions", () => {
      const result = adapter.estimateMaxSpendable!(mockAccount, undefined, makeTx("transparent"));
      expect(result).toBeUndefined();
    });

    it("returns undefined when transaction is null", () => {
      const result = adapter.estimateMaxSpendable!(mockAccount, undefined, null as any);
      expect(result).toBeUndefined();
    });

    it.each<ZcashTransferType>(["transparent-to-shielded", "shielded-to-transparent", "shielded"])(
      "throws for %s transactions (not yet implemented)",
      transferType => {
        expect(() =>
          adapter.estimateMaxSpendable!(mockAccount, undefined, makeTx(transferType)),
        ).toThrow("not yet implemented");
      },
    );
  });

  describe("prepareTransaction", () => {
    it("returns undefined for transparent transactions", () => {
      const result = adapter.prepareTransaction!(mockAccount, makeTx("transparent"));
      expect(result).toBeUndefined();
    });

    it.each<ZcashTransferType>(["transparent-to-shielded", "shielded-to-transparent", "shielded"])(
      "throws for %s transactions (not yet implemented)",
      transferType => {
        expect(() => adapter.prepareTransaction!(mockAccount, makeTx(transferType))).toThrow(
          "not yet implemented",
        );
      },
    );
  });
});
