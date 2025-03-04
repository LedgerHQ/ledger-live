import invariant from "invariant";
import { getTransactions } from "../api";
import { mapRosettaTxnToOperation } from "../bridge/synchronisation";
import { setConfig } from "./testUtils";

setConfig();

describe("synchronisation", () => {
  it("should map rosetta txn to operation", async () => {
    const txns = await getTransactions("B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD");
    const ops = (
      await Promise.all(txns.flatMap(t => mapRosettaTxnToOperation("accountId", "address", t)))
    ).flat();

    expect(ops.length).toBeGreaterThan(0);
  }, 1000000);
});

test("get transaction", async () => {
  const address = "B62qqP3a8sYEFKnDU3tdhUfmSqAP2MRqpn72jUKVEvSRVPM4bkcAV5c";
  const txs = await getTransactions(address);
  const txHash = "5JuL2ErRKXVNqN48KsYJTjsCmhbj5ufgmjDNSdH5rDU8vvC55EBD";

  const tx = txs.find(tx => tx.transaction.transaction_identifier.hash === txHash);
  invariant(tx, "tx not found");

  const op = await mapRosettaTxnToOperation("accountId", address, tx);

  expect(op).toBeDefined();
}, 1000000);
