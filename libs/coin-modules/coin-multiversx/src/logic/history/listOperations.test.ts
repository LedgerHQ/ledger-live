import { http, HttpResponse } from "msw";
import { listOperations } from "./listOperations";
import { server, useMswServer, testNetworkApi, TEST_API } from "../tests/msw";

const ADDR = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";
const RECIPIENT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";

describe("listOperations (msw)", () => {
  useMswServer();

  it("parses paginated native transactions into a fee-excluded OUT operation", async () => {
    server.use(
      http.get(`${TEST_API}/accounts/:addr/transactions/count`, () => HttpResponse.json(1)),
      http.get(`${TEST_API}/accounts/:addr/transactions`, () =>
        HttpResponse.json([
          {
            txHash: "h1",
            sender: ADDR,
            receiver: RECIPIENT,
            value: "1000000000000000000",
            fee: "50000000000000",
            round: 100,
            timestamp: 1700000000,
            status: "success",
          },
        ]),
      ),
      // no ESDT tokens → no per-token history fetch
      http.get(`${TEST_API}/accounts/:addr/tokens/count`, () => HttpResponse.json(0)),
    );

    const page = await listOperations(testNetworkApi(), ADDR, { minHeight: 0 });

    expect(page.items).toHaveLength(1);
    const op = page.items[0];
    expect(op.type).toBe("OUT");
    expect(op.tx.hash).toBe("h1");
    expect(op.value).toBe(1000000000000000000n); // fee excluded (adapter re-adds it)
    expect(op.tx.fees).toBe(50000000000000n);
  });

  it("stops paginating when the reported count is zero", async () => {
    const txList = jest.fn(() => HttpResponse.json([]));
    server.use(
      http.get(`${TEST_API}/accounts/:addr/transactions/count`, () => HttpResponse.json(0)),
      http.get(`${TEST_API}/accounts/:addr/transactions`, txList),
      http.get(`${TEST_API}/accounts/:addr/tokens/count`, () => HttpResponse.json(0)),
    );

    const page = await listOperations(testNetworkApi(), ADDR, { minHeight: 0 });

    expect(page.items).toHaveLength(0);
    expect(txList).not.toHaveBeenCalled(); // count 0 ⇒ no list request
  });
});
