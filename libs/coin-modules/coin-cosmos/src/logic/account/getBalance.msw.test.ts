import { http, HttpResponse } from "msw";
import { server, TEST_COSMOS_ENDPOINT, makeTestApi } from "../../test/msw.mock";
import { getBalance } from "./getBalance";

const ADDR = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";
const BAL = `${TEST_COSMOS_ENDPOINT}/cosmos/bank/v1beta1/balances/${ADDR}`;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getBalance via MSW", () => {
  it("returns the native balance, summing only the uatom denom", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(BAL, () =>
        HttpResponse.json({
          balances: [
            { denom: "uatom", amount: "5000000" },
            { denom: "ibc/SOMETHING", amount: "999" }, // non-native denom → ignored
          ],
        }),
      ),
    );

    const [native] = await getBalance(api, ADDR);

    expect(native.asset).toMatchObject({ type: "native" });
    expect(native.value).toBe(5_000_000n);
  });

  it("returns zero when the address holds no uatom", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(http.get(BAL, () => HttpResponse.json({ balances: [] })));

    const [native] = await getBalance(api, ADDR);

    expect(native.value).toBe(0n);
  });

  it("throws when the balances endpoint errors", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(http.get(BAL, () => new HttpResponse(null, { status: 500 })));

    await expect(getBalance(api, ADDR)).rejects.toThrow();
  });
});
