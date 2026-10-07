import { http, HttpResponse } from "msw";
import { getBalance } from "../getBalance";
import {
  TEST_EXPLORER,
  balanceHandler,
  explorerUrl,
  server,
  testContext,
  useMswServer,
} from "./helpers/msw";

useMswServer();

const ME = "bc1qhh568mfmwu7ymvwhu5e4mttpfg4ehxfpvhjs64";

describe("getBalance (explorer wire format)", () => {
  it("parses the string balance, with a single request", async () => {
    // Any other request (e.g. the mempool view) has no handler and would fail the test.
    server.use(balanceHandler(ME, "9623"));
    expect(await getBalance(testContext(), "bitcoin", ME)).toEqual([
      { value: 9623n, asset: { type: "native" } },
    ]);
  });

  it("propagates an explorer error", async () => {
    server.use(
      http.get(`${explorerUrl()}/address/${ME}/balance`, () =>
        HttpResponse.json({ message: "boom" }, { status: 500 }),
      ),
    );
    await expect(getBalance(testContext(), "bitcoin", ME)).rejects.toThrow(/./);
  });

  it("reaches the explorer the config names", async () => {
    server.use(balanceHandler(ME, "1"));
    const context = testContext({ explorer: { url: TEST_EXPLORER } });
    expect((await getBalance(context, "bitcoin", ME))[0].value).toBe(1n);
  });

  it("falls back to the currency id when the config has no explorer id", async () => {
    server.use(balanceHandler(ME, "7", "litecoin"));
    const { explorerId: _explorerId, ...config } = await testContext().config();
    const context = { ...testContext(), config: async () => config };
    expect((await getBalance(context, "litecoin", ME))[0].value).toBe(7n);
  });
});
