import { getSpendableUtxos } from "../getSpendableUtxos";
import {
  pendingUtxosHandler,
  server,
  testContext,
  txHandler,
  useMswServer,
  utxosHandler,
} from "./helpers/msw";

useMswServer();

const ME = "bc1qhh568mfmwu7ymvwhu5e4mttpfg4ehxfpvhjs64";

const output = (hash: string, value: string, outputIndex = 0) => ({
  txId: hash.repeat(64),
  hash: hash.repeat(64),
  outputIndex,
  value,
  hex: "0014bde9a3ed3b773c4db1d7e5335dad614a2b9b9921",
  type: "witness_v0_keyhash",
  owner: ME,
});

const outpoints = (utxos: { hash: string; outputIndex: number }[]) =>
  utxos.map(utxo => `${utxo.hash.slice(0, 1)}:${utxo.outputIndex}`);

const config = () => testContext().config();

describe("getSpendableUtxos", () => {
  it("returns the confirmed outputs when nothing is pending", async () => {
    server.use(
      utxosHandler(ME, [{ data: [output("a", "100")], token: null }]),
      pendingUtxosHandler(ME),
    );
    expect(outpoints(await getSpendableUtxos(await config(), "bitcoin", ME))).toEqual(["a:0"]);
  });

  it("excludes a confirmed output a mempool transaction already spends", async () => {
    server.use(
      utxosHandler(ME, [{ data: [output("a", "100"), output("b", "200")], token: null }]),
      pendingUtxosHandler(ME, { spent: [output("a", "100")] }),
    );
    expect(outpoints(await getSpendableUtxos(await config(), "bitcoin", ME))).toEqual(["b:0"]);
  });

  it("spends the change of the address's own unconfirmed transaction", async () => {
    // Unconfirmed transaction c spends confirmed output a and returns change to the address.
    server.use(
      utxosHandler(ME, [{ data: [output("a", "100"), output("b", "200")], token: null }]),
      pendingUtxosHandler(ME, { spent: [output("a", "100")], created: [output("c", "50", 1)] }),
      txHandler("c".repeat(64), [`${"a".repeat(64)}:0`]),
    );
    expect(outpoints(await getSpendableUtxos(await config(), "bitcoin", ME))).toEqual([
      "b:0",
      "c:1",
    ]);
  });

  it("does not spend an unconfirmed payment from someone else, which its sender can replace", async () => {
    server.use(
      utxosHandler(ME, [{ data: [output("a", "100")], token: null }]),
      pendingUtxosHandler(ME, { created: [output("c", "50", 1)] }),
      txHandler("c".repeat(64), [`${"e".repeat(64)}:3`]),
    );
    expect(outpoints(await getSpendableUtxos(await config(), "bitcoin", ME))).toEqual(["a:0"]);
  });

  it("does not spend an incoming unconfirmed payment alongside an own unconfirmed send", async () => {
    // c is the address's own send (it spends a); d pays the address from elsewhere.
    server.use(
      utxosHandler(ME, [{ data: [output("a", "100")], token: null }]),
      pendingUtxosHandler(ME, {
        spent: [output("a", "100")],
        created: [output("c", "50"), output("d", "70")],
      }),
      txHandler("c".repeat(64), [`${"a".repeat(64)}:0`]),
      txHandler("d".repeat(64), [`${"e".repeat(64)}:0`]),
    );
    expect(outpoints(await getSpendableUtxos(await config(), "bitcoin", ME))).toEqual(["c:0"]);
  });

  it("spends the change of a chain of own unconfirmed transactions, each once", async () => {
    // a → c (own change c:0, spent by d) → d (own change d:0, listed twice by the explorer).
    server.use(
      utxosHandler(ME, [{ data: [output("a", "100")], token: null }]),
      pendingUtxosHandler(ME, {
        spent: [output("a", "100"), output("c", "50")],
        created: [output("c", "50"), output("d", "40"), output("d", "40")],
      }),
      txHandler("c".repeat(64), [`${"a".repeat(64)}:0`]),
      txHandler("d".repeat(64), [`${"c".repeat(64)}:0`]),
    );
    expect(outpoints(await getSpendableUtxos(await config(), "bitcoin", ME))).toEqual(["d:0"]);
  });

  it("does not read unconfirmed transactions when the address has none of its own", async () => {
    // Without any output spent in the mempool, no unconfirmed output can be the address's change;
    // no tx handler is served, so a read would fail the test.
    server.use(
      utxosHandler(ME, [{ data: [output("a", "100")], token: null }]),
      pendingUtxosHandler(ME, { created: [output("c", "50")] }),
    );
    expect(outpoints(await getSpendableUtxos(await config(), "bitcoin", ME))).toEqual(["a:0"]);
  });

  it("reads outpoints whichever way the explorer names them", async () => {
    server.use(
      utxosHandler(ME, [
        {
          data: [
            { txId: "a".repeat(64), outputIndex: 1, value: "100", type: "witness_v0_keyhash" },
            { tx_id: "b".repeat(64), output_index: 2, value: 200 },
          ],
          token: null,
        },
      ]),
      pendingUtxosHandler(ME, {
        spent: [{ tx_id: "b".repeat(64), output_index: 2, value: "200" }],
        created: [{ txId: "c".repeat(64), outputIndex: 0, value: "50" }],
      }),
      txHandler("c".repeat(64), [`${"b".repeat(64)}:2`]),
    );
    const utxos = await getSpendableUtxos(await config(), "bitcoin", ME);
    expect(utxos.map(utxo => [utxo.hash, utxo.outputIndex, utxo.value])).toEqual([
      ["a".repeat(64), 1, "100"],
      ["c".repeat(64), 0, "50"],
    ]);
  });

  it("stops when the explorer repeats a page cursor", async () => {
    server.use(
      utxosHandler(ME, [
        { data: [output("a", "100")], token: "1" },
        { data: [output("b", "100")], token: "1" },
      ]),
      pendingUtxosHandler(ME),
    );
    await expect(getSpendableUtxos(await config(), "bitcoin", ME)).rejects.toThrow(
      "explorer repeated a UTXO page cursor",
    );
  });

  it("fails loudly on a UTXO without an outpoint", async () => {
    server.use(
      utxosHandler(ME, [{ data: [{ outputIndex: 0, value: "100" }], token: null }]),
      pendingUtxosHandler(ME),
    );
    await expect(getSpendableUtxos(await config(), "bitcoin", ME)).rejects.toThrow(
      "explorer returned an unusable UTXO",
    );
  });

  it("unwraps entries tagged with their kind, as some explorer versions return them", async () => {
    server.use(
      utxosHandler(ME, [
        { data: [{ Mined: { txId: "a".repeat(64), outputIndex: 0, value: "100" } }], token: null },
      ]),
      pendingUtxosHandler(ME, {
        spent: [{ Pending: { txId: "a".repeat(64), outputIndex: 0, value: "100" } }],
        created: [{ Pending: { txId: "c".repeat(64), outputIndex: 1, value: "300000000" } }],
      }),
      txHandler("c".repeat(64), [`${"a".repeat(64)}:0`]),
    );
    const utxos = await getSpendableUtxos(await config(), "bitcoin", ME);
    expect(utxos.map(utxo => [utxo.hash, utxo.outputIndex, utxo.value])).toEqual([
      ["c".repeat(64), 1, "300000000"],
    ]);
  });

  it("identifies an output by its transaction id, not by the witness hash", async () => {
    server.use(
      utxosHandler(ME, [
        {
          data: [{ txId: "a".repeat(64), hash: "f".repeat(64), outputIndex: 0, value: "100" }],
          token: null,
        },
      ]),
      pendingUtxosHandler(ME),
    );
    const [utxo] = await getSpendableUtxos(await config(), "bitcoin", ME);
    expect(utxo.hash).toBe("a".repeat(64));
  });
});
