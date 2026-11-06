import { createMockOperationView } from "../../test/fixtures";
import type { OperationView } from "../../types/gateway";
import { toOperation } from "../toOperation";

const NATIVE = "Amulet";

const map = (row: OperationView, partyId = "alice-party") => toOperation(NATIVE, partyId, row);

function withoutField<K extends keyof OperationView>(key: K): OperationView {
  const { [key]: _omitted, ...rest } = createMockOperationView();
  return rest as OperationView;
}

const transferWithDetails = (details: OperationView["details"]) => [
  { address: "bob-party", type: "Send" as const, value: "100", details, asset: NATIVE },
];

describe("toOperation", () => {
  describe("asset", () => {
    it("maps the native instrument to the framework's native asset", () => {
      expect(map(createMockOperationView()).asset).toEqual({ type: "native" });
    });

    it("maps a token to its instrument id and admin", () => {
      const row = createMockOperationView({
        asset: { type: "token", instrumentAdmin: "IssuerA", instrumentId: "USDCx" },
      });

      expect(map(row).asset).toEqual({
        type: "token",
        assetReference: "USDCx",
        assetOwner: "IssuerA",
      });
    });

    it("keeps a template asset's identity instead of reading it as native", () => {
      const row = createMockOperationView({
        type: "Initialize",
        asset: { type: "template", packageId: "pkg", moduleName: "Mod", entityName: "Entity" },
      });

      const operation = map(row);

      expect(operation.asset).toEqual({ type: "template", assetReference: "pkg:Mod:Entity" });
      expect(operation.type).toBe("PRE_APPROVAL");
    });

    it("reads a row without an asset as native", () => {
      expect(map(withoutField("asset")).asset).toEqual({ type: "native" });
    });
  });

  describe("type", () => {
    it("is OUT for a send from the party and IN for the counterparty", () => {
      const row = createMockOperationView();

      expect(map(row, "alice-party").type).toBe("OUT");
      expect(map(row, "bob-party").type).toBe("IN");
    });

    it("is FEES for a zero-value send such as a merge-split", () => {
      const row = createMockOperationView({
        details: { operationType: "merge-split" },
        transfers: [
          { address: "alice-party", type: "Send", value: "0", details: {}, asset: NATIVE },
        ],
      });

      expect(map(row).type).toBe("FEES");
    });

    it("maps Canton subtypes such as a transfer proposal", () => {
      const row = createMockOperationView({ details: { operationType: "transfer-proposal" } });

      expect(map(row).type).toBe("TRANSFER_PROPOSAL");
    });

    it("falls back to the transfer's operation subtype when the row has none", () => {
      const row = createMockOperationView({
        transfers: [
          {
            address: "bob-party",
            type: "Send",
            value: "100",
            details: { operationType: "transfer-withdrawn" },
            asset: NATIVE,
          },
        ],
      });

      expect(map(row).type).toBe("TRANSFER_WITHDRAWN");
    });

    it("keeps rows that are not sends, such as a tap received", () => {
      const row = createMockOperationView({ type: "Receive", details: { operationType: "tap" } });

      expect(map(row).type).toBe("IN");
    });

    it("reads a row without transfers as a zero-value operation", () => {
      const operation = map(withoutField("transfers"));

      expect(operation.value).toBe(0n);
      expect(operation.type).toBe("FEES");
    });
  });

  describe("memo", () => {
    it("is the metadata reason", () => {
      const row = createMockOperationView({ details: { metadata: { reason: "rent" } } });

      expect(map(row).details?.memo).toBe("rent");
    });

    it("falls back to the explicit memo field", () => {
      const row = createMockOperationView({ details: { memo: "invoice 42" } });

      expect(map(row).details?.memo).toBe("invoice 42");
    });

    it("prefers the metadata reason over the memo field", () => {
      const row = createMockOperationView({
        details: { memo: "memo field", metadata: { reason: "reason" } },
      });

      expect(map(row).details?.memo).toBe("reason");
    });

    it("is read from the transfer when only the transfer carries it", () => {
      const row = createMockOperationView({
        details: { operationType: "transfer" },
        transfers: transferWithDetails({ metadata: { reason: "test transfer" } }),
      });

      expect(map(row).details?.memo).toBe("test transfer");
    });

    it("is absent when neither the row nor its transfer has one", () => {
      expect(map(createMockOperationView()).details).toEqual({ ledgerOpType: "OUT" });
    });
  });

  describe("generic bridge metadata", () => {
    const tokenRow = createMockOperationView({
      asset: { type: "token", instrumentAdmin: "IssuerA", instrumentId: "USDCx" },
    });

    it("repeats the type as ledgerOpType, which token sub-operations are typed from", () => {
      expect(map(tokenRow, "alice-party").details?.ledgerOpType).toBe("OUT");
      expect(map(tokenRow, "bob-party").details?.ledgerOpType).toBe("IN");
    });

    it("names the sender as the fee payer, whichever party is queried", () => {
      expect(map(tokenRow, "alice-party").tx.feesPayer).toBe("alice-party");
      expect(map(tokenRow, "bob-party").tx.feesPayer).toBe("alice-party");
    });

    it("names no fee payer for a row without senders", () => {
      expect(map(withoutField("senders")).tx).not.toHaveProperty("feesPayer");
    });
  });

  describe("tx", () => {
    it("keeps the fee out of the value and maps the block from the row", () => {
      const operation = map(createMockOperationView());

      expect(operation.value).toBe(100n);
      expect(operation.tx).toEqual({
        hash: "0xtxhash",
        fees: 1n,
        feesPayer: "alice-party",
        date: new Date("2024-01-01T00:00:00.000Z"),
        block: { height: 10, hash: "blockhash", time: new Date("2024-01-01T00:00:00.000Z") },
        failed: false,
      });
    });

    it("uses an empty block hash when the row has none", () => {
      const row = createMockOperationView({
        block: { height: 10, time: "2024-01-01T00:00:00.000Z" },
      });

      expect(map(row).tx.block.hash).toBe("");
    });

    it("marks a failed row as failed", () => {
      expect(map(createMockOperationView({ status: "Failed" })).tx.failed).toBe(true);
    });
  });
});
