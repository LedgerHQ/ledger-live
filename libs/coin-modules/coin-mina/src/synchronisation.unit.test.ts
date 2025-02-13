import { getTransactions } from "./api";
import { mapRosettaTxnToOperation } from "./synchronisation";
import { setConfig } from "./testUtils";

setConfig();

describe("synchronisation", () => {
  it("should map rosetta txn to operation", async () => {
    const txns = await getTransactions("B62qkdFWJSW8zaTBZjTVtmeU3rVxyUkNxPhKKW8T2JBtpj5XfdywLSM");
    const ops = txns.flatMap(t => mapRosettaTxnToOperation("accountId", "address", t));

    expect(ops.length).toBeGreaterThan(0);
    expect(ops.filter(op => op.hasFailed).length).toBeGreaterThan(0);
  }, 1000000);
});
