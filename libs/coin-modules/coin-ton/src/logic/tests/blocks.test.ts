import { BlockNotFoundError } from "@ledgerhq/coin-module-framework/errors";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TON_API_MOCKED, createMockTonContext } from "../../test/context";
import { getBlockInfo } from "../getBlockInfo";
import { lastBlock } from "../lastBlock";

const TIP = {
  workchain: -1,
  shard: "8000000000000000",
  seqno: 100288322,
  root_hash: "dlZtM3CpIDE6Vfw0tkkYR4YB7Uis6fPyiVfaLtXwbEI=",
  gen_utime: "1792521953",
};

const TIP_INFO = { height: 100288322, hash: TIP.root_hash, time: new Date(1792521953000) };

describe("blocks", () => {
  const server = setupServer();
  const context = createMockTonContext();

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("reads the last masterchain block", async () => {
    server.use(
      http.get(`${TON_API_MOCKED}/masterchainInfo`, () =>
        HttpResponse.json({ first: { ...TIP, seqno: 1 }, last: TIP }),
      ),
    );

    await expect(lastBlock(context)).resolves.toEqual(TIP_INFO);
  });

  it("reads a masterchain block by height, in the same shape as the tip", async () => {
    let params: URLSearchParams | undefined;
    server.use(
      http.get(`${TON_API_MOCKED}/blocks`, ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({ blocks: [TIP] });
      }),
    );

    await expect(getBlockInfo(context, TIP.seqno)).resolves.toEqual(TIP_INFO);
    expect(Object.fromEntries(params ?? [])).toEqual({
      workchain: "-1",
      seqno: String(TIP.seqno),
      limit: "1",
    });
  });

  it("refuses a height the indexer has no block for", async () => {
    server.use(http.get(`${TON_API_MOCKED}/blocks`, () => HttpResponse.json({ blocks: [] })));

    await expect(getBlockInfo(context, TIP.seqno + 1000)).rejects.toThrow(BlockNotFoundError);
  });
});
