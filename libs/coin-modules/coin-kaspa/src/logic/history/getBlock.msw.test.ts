import { http, HttpResponse } from "msw";
import {
  CHAIN_HASH,
  TEST_KASPA_ENDPOINT,
  makeApiBlock,
  makeApiOutput,
  makeApiTx,
  server,
} from "../../test/msw.mock";
import { getBlock } from "./getBlock";

const BLOCKS_URL = `${TEST_KASPA_ENDPOINT}/blocks-from-bluescore`;
const ADDR = "kaspa:qpy827u4r43hp36nu2w78dphwgzjr3e9xdwwvm7k7dalyhpfkr84qucn4ecud";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getBlock via MSW", () => {
  it("requests transactions and maps outputs to incoming native transfer operations", async () => {
    server.use(
      http.get(BLOCKS_URL, ({ request }) => {
        expect(new URL(request.url).searchParams.get("includeTransactions")).toBe("true");
        return HttpResponse.json([
          makeApiBlock({
            hash: CHAIN_HASH,
            isChainBlock: true,
            transactions: [
              makeApiTx({
                id: "tx-a",
                outputs: [makeApiOutput(ADDR, 254705948), makeApiOutput(null, 999)],
                computeMass: 1967,
              }),
            ],
          }),
        ]);
      }),
    );

    const block = await getBlock(480818084);

    expect(block.info.hash).toBe(CHAIN_HASH);
    expect(block.transactions).toHaveLength(1);

    const [tx] = block.transactions;
    expect(tx.hash).toBe("tx-a");
    expect(tx.failed).toBe(false);
    expect(tx.fees).toBe(0n);
    // the address-less output is skipped; only the resolved one becomes an operation
    expect(tx.operations).toEqual([
      { type: "transfer", address: ADDR, asset: { type: "native" }, amount: 254705948n },
    ]);
  });

  it("throws when no block exists at the blue score", async () => {
    server.use(http.get(BLOCKS_URL, () => HttpResponse.json([])));

    await expect(getBlock(42)).rejects.toThrow("kaspa: no block at blueScore 42");
  });
});
