import { http, HttpResponse } from "msw";
import { getNextSequence } from "./getNextSequence";
import { server, useMswServer, testNetworkApi, TEST_API } from "../tests/msw";

const ADDR = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

describe("getNextSequence (msw)", () => {
  useMswServer();

  it("returns the account nonce as a bigint", async () => {
    server.use(
      http.get(`${TEST_API}/accounts/:addr`, () =>
        HttpResponse.json({ balance: "0", nonce: 7, isGuarded: false }),
      ),
    );

    const nonce = await getNextSequence(testNetworkApi(), ADDR);

    expect(nonce).toBe(7n);
  });
});
