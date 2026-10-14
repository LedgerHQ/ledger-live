import { Transaction } from "bitcoinjs-lib";
import { BTC_CHANGE, BTC_RECIPIENT, fakeExplorer } from "../test/fakeExplorer";
import { cryptoFor } from "./currency";
import { getTransaction } from "./getTransaction";

const crypto = cryptoFor("bitcoin");

describe("getTransaction", () => {
  it("decodes the transaction and its fee, an OP_RETURN output having no address", async () => {
    const prev = new Transaction();
    prev.addInput(Buffer.alloc(32, 7), 0);
    prev.addOutput(crypto.toOutputScript(BTC_CHANGE), 100_000);
    const tx = new Transaction();
    tx.addInput(Buffer.from(prev.getId(), "hex").reverse(), 0, 0xfffffffd);
    tx.addOutput(crypto.toOutputScript(BTC_RECIPIENT), 90_000);
    tx.addOutput(Buffer.from("6a0100", "hex"), 0);
    tx.addOutput(crypto.toOutputScript(BTC_CHANGE), 9_000);
    const explorer = fakeExplorer({
      txHex: { [prev.getId()]: prev.toHex(), [tx.getId()]: tx.toHex() },
    });

    expect(await getTransaction(explorer, "bitcoin", tx.getId())).toEqual({
      id: tx.getId(),
      fees: "1000",
      inputs: [
        {
          txid: prev.getId(),
          vout: 0,
          address: BTC_CHANGE,
          value: "100000",
          sequence: 0xfffffffd,
        },
      ],
      outputs: [
        { index: 0, address: BTC_RECIPIENT, value: "90000" },
        { index: 1, value: "0" },
        { index: 2, address: BTC_CHANGE, value: "9000" },
      ],
    });
  });

  it("leaves out the address of an input it cannot decode", async () => {
    const prev = new Transaction();
    prev.addInput(Buffer.alloc(32, 7), 0);
    prev.addOutput(Buffer.from("6a0100", "hex"), 5_000);
    const tx = new Transaction();
    tx.addInput(Buffer.from(prev.getId(), "hex").reverse(), 0, 0xffffffff);
    tx.addOutput(crypto.toOutputScript(BTC_RECIPIENT), 4_000);
    const explorer = fakeExplorer({
      txHex: { [prev.getId()]: prev.toHex(), [tx.getId()]: tx.toHex() },
    });

    const { inputs } = await getTransaction(explorer, "bitcoin", tx.getId());
    expect(inputs).toEqual([{ txid: prev.getId(), vout: 0, value: "5000", sequence: 0xffffffff }]);
  });

  it("fails when the network does not know the transaction", async () => {
    await expect(getTransaction(fakeExplorer(), "bitcoin", "gone")).rejects.toThrow(
      "Original transaction gone could not be fetched",
    );
  });
});
