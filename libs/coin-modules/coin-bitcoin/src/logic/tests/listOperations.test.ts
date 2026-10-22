import { http, HttpResponse } from "msw";
import { listOperations } from "../listOperations";
import { explorerUrl, makeTx, server, testContext, useMswServer } from "./helpers/msw";

useMswServer();

const ME = "bc1qhh568mfmwu7ymvwhu5e4mttpfg4ehxfpvhjs64";
const BLOCK = { hash: "cd".repeat(32), height: 944_351, time: "2026-04-09T15:31:22Z" };

function txsHandler(
  onRequest: (params: URLSearchParams) => { data: unknown[]; token: string | null },
) {
  return http.get(`${explorerUrl()}/address/${ME}/txs`, ({ request }) =>
    HttpResponse.json(onRequest(new URL(request.url).searchParams)),
  );
}

const incoming = (hash: string) =>
  makeTx(hash, {
    fees: "100",
    block: BLOCK,
    inputs: [{ address: "1C6XJtNXiuXvk4oUAVMkKF57CRpaTrN5Ra", value: "20000", output_index: 1 }],
    outputs: [{ address: ME, value: "9623", output_index: 0 }],
  });

describe("listOperations (explorer wire format)", () => {
  it("maps the options to the explorer's query and propagates the cursor", async () => {
    let seen: URLSearchParams | undefined;
    server.use(
      txsHandler(params => {
        seen = params;
        return { data: [incoming("11".repeat(32))], token: "next-page" };
      }),
    );
    const page = await listOperations(testContext(), "bitcoin", ME, {
      minHeight: 900_000,
      order: "asc",
      limit: 20,
      cursor: "this-page",
    });
    expect(Object.fromEntries(seen!)).toEqual({
      order: "ascending",
      batch_size: "20",
      from_height: "900000",
      token: "this-page",
    });
    expect(page.next).toBe("next-page");
    expect(page.items.map(op => [op.type, op.value])).toEqual([["IN", 9623n]]);
  });

  it("reads newest first from the start by default, and ends when the explorer has no next page", async () => {
    let seen: URLSearchParams | undefined;
    server.use(
      txsHandler(params => {
        seen = params;
        return { data: [], token: null };
      }),
    );
    const page = await listOperations(testContext(), "bitcoin", ME, { minHeight: 0 });
    expect(seen?.get("order")).toBe("descending");
    expect(seen?.has("from_height")).toBe(false);
    expect(seen?.has("token")).toBe(false);
    expect(page).toEqual({ items: [], next: undefined });
  });

  it("reads one page per call: the next page from its cursor, never the whole history", async () => {
    // Three pages of two transactions; the explorer's token names the next page.
    const pages = [0, 1, 2].map(page => ({
      data: [incoming(`${page}a`.repeat(32)), incoming(`${page}b`.repeat(32))],
      token: page < 2 ? `page-${page + 1}` : null,
    }));
    const requested: (string | null)[] = [];
    server.use(
      txsHandler(params => {
        requested.push(params.get("token"));
        const token = params.get("token");
        return pages[token ? Number(token.slice(5)) : 0];
      }),
    );

    const first = await listOperations(testContext(), "bitcoin", ME, { minHeight: 0, limit: 2 });
    expect(requested).toEqual([null]);
    expect(first.items.map(op => op.tx.hash)).toEqual(["0a".repeat(32), "0b".repeat(32)]);
    expect(first.next).toBe("page-1");

    const second = await listOperations(testContext(), "bitcoin", ME, {
      minHeight: 0,
      limit: 2,
      cursor: first.next!,
    });
    expect(requested).toEqual([null, "page-1"]);
    expect(second.items.map(op => op.tx.hash)).toEqual(["1a".repeat(32), "1b".repeat(32)]);
    expect(second.next).toBe("page-2");

    const last = await listOperations(testContext(), "bitcoin", ME, {
      minHeight: 0,
      limit: 2,
      cursor: second.next!,
    });
    expect(requested).toEqual([null, "page-1", "page-2"]);
    expect(last.next).toBeUndefined();
  });

  it("propagates an explorer error", async () => {
    server.use(
      http.get(`${explorerUrl()}/address/${ME}/txs`, () =>
        HttpResponse.json({ message: "boom" }, { status: 500 }),
      ),
    );
    await expect(listOperations(testContext(), "bitcoin", ME, { minHeight: 0 })).rejects.toThrow(
      /./,
    );
  });
});
