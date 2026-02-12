import { IDL } from "@icp-sdk/core/candid";
import { idlFactory as indexIdlFactory } from "./index.idl";
import { idlFactory as ledgerIdlFactory } from "./ledger.idl";

describe("IDL factories", () => {
  describe("index.idl", () => {
    it("should produce a valid IDL service with expected methods", () => {
      const service = indexIdlFactory({ IDL });
      expect(service).toBeDefined();

      const fields = (service as any)._fields as [string, unknown][];
      const methodNames = fields.map(([name]) => name);

      expect(methodNames).toContain("get_account_identifier_balance");
      expect(methodNames).toContain("get_account_identifier_transactions");
      expect(methodNames).toContain("get_account_transactions");
      expect(methodNames).toContain("get_blocks");
      expect(methodNames).toContain("http_request");
      expect(methodNames).toContain("icrc1_balance_of");
      expect(methodNames).toContain("ledger_id");
      expect(methodNames).toContain("status");
    });
  });

  describe("ledger.idl", () => {
    it("should produce a valid IDL service with expected methods", () => {
      const service = ledgerIdlFactory({ IDL });
      expect(service).toBeDefined();

      const fields = (service as any)._fields as [string, unknown][];
      const methodNames = fields.map(([name]) => name);

      expect(methodNames).toContain("transfer");
      expect(methodNames).toContain("query_blocks");
      expect(methodNames).toContain("query_encoded_blocks");
      expect(methodNames).toContain("icrc1_transfer");
      expect(methodNames).toContain("icrc2_approve");
      expect(methodNames).toContain("icrc2_transfer_from");
      expect(methodNames).toContain("account_balance");
      expect(methodNames).toContain("account_balance_dfx");
      expect(methodNames).toContain("send_dfx");
      expect(methodNames).toContain("transfer_fee");
      expect(methodNames).toContain("icrc21_canister_call_consent_message");
    });
  });
});
