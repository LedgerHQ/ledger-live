import { anOperation } from "@ledgerhq/account-module-framework/test-utils";
import { conflictingTransactions } from "./intent";

describe("conflictingTransactions", () => {
  it("lists the other pending transactions spending one of the outpoints", () => {
    const pending = (hash: string, inputs: string[]) =>
      anOperation({ id: hash, hash, block: null, details: { inputs } });
    const operations = [
      pending("replaced", ["a-0"]),
      pending("child", ["a-0", "b-1"]),
      pending("child", ["a-0"]),
      pending("unrelated", ["c-0"]),
      anOperation({ id: "confirmed", hash: "confirmed", details: { inputs: ["a-0"] } }),
    ];
    expect(conflictingTransactions(operations, "replaced", new Set(["a-0"]))).toEqual(["child"]);
  });
});
