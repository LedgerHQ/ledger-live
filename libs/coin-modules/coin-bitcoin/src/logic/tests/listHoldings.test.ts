import { http, HttpResponse } from "msw";
import type { Holding, Page } from "@ledgerhq/coin-module-framework/api/types";
import { getSpendableUtxos } from "../getSpendableUtxos";
import { listHoldings } from "../listHoldings";
import {
  explorerUrl,
  pendingUtxosHandler,
  server,
  testContext,
  txHandler,
  useMswServer,
  utxosHandler,
} from "./helpers/msw";

useMswServer();

const ME = "bc1qhh568mfmwu7ymvwhu5e4mttpfg4ehxfpvhjs64";
const BCH_ADDRESS = "qzf9ax7we6swngffah3e9gr4mgh0qw3zcy6kq5afau";

const output = (hash: string, value: string, outputIndex = 0, height?: number) => ({
  txId: hash.repeat(64),
  hash: hash.repeat(64),
  outputIndex,
  value,
  hex: "0014bde9a3ed3b773c4db1d7e5335dad614a2b9b9921",
  type: "witness_v0_keyhash",
  owner: ME,
  ...(height === undefined ? {} : { height }),
});

const ids = (page: Page<Holding>) => page.items.map(holding => holding.id.replace(/^(.)\1+/, "$1"));

const list = (options?: Parameters<typeof listHoldings>[3]) =>
  listHoldings(testContext(), "bitcoin", ME, options);

describe("listHoldings", () => {
  it("lists one holding per confirmed output, without a next page on the last one", async () => {
    server.use(
      utxosHandler(ME, [
        { data: [output("a", "100", 0, 800000), output("b", "200", 1)], token: null },
      ]),
      pendingUtxosHandler(ME),
    );
    const page = await list();
    expect(page).toEqual({
      items: [
        {
          id: `${"a".repeat(64)}:0`,
          asset: { type: "native" },
          value: 100n,
          height: 800000,
        },
        {
          id: `${"b".repeat(64)}:1`,
          asset: { type: "native" },
          value: 200n,
        },
      ],
    });
    expect(page.items[1]).not.toHaveProperty("height");
    expect(page).not.toHaveProperty("next");
  });

  it("does not list a confirmed output a mempool transaction spends", async () => {
    server.use(
      utxosHandler(ME, [{ data: [output("a", "100"), output("b", "200")], token: null }]),
      pendingUtxosHandler(ME, { spent: [output("a", "100")] }),
    );
    expect(ids(await list())).toEqual(["b:0"]);
  });

  it("appends the address's own unconfirmed change on the first page, with a null height", async () => {
    server.use(
      utxosHandler(ME, [{ data: [output("a", "100"), output("b", "200")], token: null }]),
      pendingUtxosHandler(ME, { spent: [output("a", "100")], created: [output("c", "50", 1)] }),
      txHandler("c".repeat(64), [`${"a".repeat(64)}:0`]),
    );
    const page = await list();
    expect(ids(page)).toEqual(["b:0", "c:1"]);
    expect(page.items[1]).toEqual({
      id: `${"c".repeat(64)}:1`,
      asset: { type: "native" },
      value: 50n,
      height: null,
    });
  });

  it("keeps the height of a confirmed output and gives own change a null one", async () => {
    server.use(
      utxosHandler(ME, [
        { data: [output("a", "100", 0, 800000), output("b", "200", 1, 800001)], token: null },
      ]),
      pendingUtxosHandler(ME, { spent: [output("a", "100")], created: [output("c", "50", 1)] }),
      txHandler("c".repeat(64), [`${"a".repeat(64)}:0`]),
    );
    const page = await list();
    expect(page.items.map(holding => holding.height)).toEqual([800001, null]);
  });

  it("lists an own change the explorer repeats only once", async () => {
    server.use(
      utxosHandler(ME, [{ data: [output("a", "100")], token: null }]),
      pendingUtxosHandler(ME, {
        spent: [output("a", "100")],
        created: [output("c", "50"), output("c", "50")],
      }),
      txHandler("c".repeat(64), [`${"a".repeat(64)}:0`]),
    );
    expect(ids(await list())).toEqual(["c:0"]);
  });

  it("does not list an unconfirmed payment from someone else", async () => {
    server.use(
      utxosHandler(ME, [{ data: [output("a", "100")], token: null }]),
      pendingUtxosHandler(ME, { created: [output("c", "50", 1)] }),
      txHandler("c".repeat(64), [`${"e".repeat(64)}:3`]),
    );
    expect(ids(await list())).toEqual(["a:0"]);
  });

  it("returns one explorer page per call and no own change after the first page", async () => {
    server.use(
      utxosHandler(ME, [
        { data: [output("a", "100")], token: "1" },
        { data: [output("b", "200")], token: null },
      ]),
      pendingUtxosHandler(ME, { spent: [output("z", "9")], created: [output("c", "50")] }),
      txHandler("c".repeat(64), [`${"z".repeat(64)}:0`]),
    );
    const first = await list();
    expect(ids(first)).toEqual(["a:0", "c:0"]);
    expect(first.next).toBe("1");

    const second = await list({ cursor: first.next as string });
    expect(ids(second)).toEqual(["b:0"]);
    expect(second).not.toHaveProperty("next");
  });

  it("reads no transaction on a later page, yet still drops mempool-spent outputs", async () => {
    const requested: string[] = [];
    server.use(
      http.get(`${explorerUrl()}/tx/*`, ({ request }) => {
        requested.push(new URL(request.url).pathname);
        return HttpResponse.json({});
      }),
      utxosHandler(ME, [
        { data: [output("a", "100")], token: "1" },
        { data: [output("b", "200"), output("d", "300")], token: null },
      ]),
      pendingUtxosHandler(ME, { spent: [output("b", "200")], created: [output("c", "50")] }),
    );
    expect(ids(await list({ cursor: "1" }))).toEqual(["d:0"]);
    expect(requested).toEqual([]);
  });

  it("returns an empty page with a next when every output of the page is mempool-spent", async () => {
    server.use(
      utxosHandler(ME, [
        { data: [output("a", "100"), output("b", "200")], token: "1" },
        { data: [output("d", "300")], token: null },
      ]),
      pendingUtxosHandler(ME, { spent: [output("a", "100"), output("b", "200")] }),
    );
    expect(await list()).toEqual({ items: [], next: "1" });
    expect(ids(await list({ cursor: "1" }))).toEqual(["d:0"]);
  });

  it("ends the stream, keeping the page, when the explorer answers with the cursor it was given", async () => {
    server.use(
      utxosHandler(ME, [
        { data: [output("a", "100")], token: "1" },
        { data: [output("b", "200")], token: "1" },
      ]),
      pendingUtxosHandler(ME),
    );
    const page = await list({ cursor: "1" });
    expect(page.items.map(holding => holding.id)).toEqual([`${"b".repeat(64)}:0`]);
    expect(page.next).toBeUndefined();
  });

  it("fails loudly on a UTXO without an outpoint", async () => {
    server.use(
      utxosHandler(ME, [{ data: [{ outputIndex: 0, value: "100" }], token: null }]),
      pendingUtxosHandler(ME),
    );
    await expect(list()).rejects.toThrow("explorer returned an unusable UTXO");
  });

  it("queries a Bitcoin Cash address in its cashaddr form", async () => {
    const requested: string[] = [];
    server.use(
      http.get(`${explorerUrl()}/address/*/utxos`, ({ request }) => {
        requested.push(new URL(request.url).pathname);
        return HttpResponse.json({ data: [], token: null });
      }),
      http.get(`${explorerUrl()}/address/*/utxos/pending`, ({ request }) => {
        requested.push(new URL(request.url).pathname);
        return HttpResponse.json({ spent: [], created: [] });
      }),
    );
    await listHoldings(testContext(), "bitcoin_cash", BCH_ADDRESS);
    expect(requested.sort()).toEqual([
      `/blockchain/v4/btc/address/bitcoincash:${BCH_ADDRESS}/utxos`,
      `/blockchain/v4/btc/address/bitcoincash:${BCH_ADDRESS}/utxos/pending`,
    ]);
  });

  it("returns an empty page without any request for a token asset", async () => {
    // No handler is served, so any request fails the test.
    const asset = { type: "erc20" as const, assetReference: "0xabc" };
    expect(await list({ asset })).toEqual({ items: [] });
  });

  it("lists the native asset when it is requested", async () => {
    server.use(
      utxosHandler(ME, [{ data: [output("a", "100")], token: null }]),
      pendingUtxosHandler(ME),
    );
    expect(ids(await list({ asset: { type: "native" } }))).toEqual(["a:0"]);
  });

  it("lists, across all its pages, exactly the outputs getSpendableUtxos returns", async () => {
    server.use(
      utxosHandler(ME, [
        { data: [output("a", "100"), output("b", "200")], token: "1" },
        { data: [output("d", "300"), output("e", "400", 2)], token: "2" },
        { data: [output("f", "500")], token: null },
      ]),
      pendingUtxosHandler(ME, {
        spent: [output("a", "100"), output("e", "400", 2)],
        created: [output("c", "50", 1), output("g", "70")],
      }),
      txHandler("c".repeat(64), [`${"a".repeat(64)}:0`]),
      txHandler("g".repeat(64), [`${"x".repeat(64)}:0`]),
    );
    const listed: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ ...(cursor ? { cursor } : {}) });
      listed.push(...page.items.map(holding => holding.id));
      cursor = page.next;
    } while (cursor);

    const config = await testContext().config();
    const spendable = await getSpendableUtxos(config, ME);
    expect(listed.sort()).toEqual(spendable.map(utxo => `${utxo.hash}:${utxo.outputIndex}`).sort());
    expect(listed).toHaveLength(4);
  });
});
