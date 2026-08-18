import { http, HttpResponse } from "msw";
import { TEST_KASPA_ENDPOINT, server } from "../../test/msw.mock";
import { getBalance } from "./getBalance";

const BALANCES_URL = `${TEST_KASPA_ENDPOINT}/addresses/balances`;
const ADDR = "kaspa:qz24c4tse54c2f9v02ap2l3957uw5kq3rdg960gvw50wtvvy0nxax5jt8zckp";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getBalance via MSW", () => {
  it("returns a single native KAS balance for the address", async () => {
    server.use(
      http.post(BALANCES_URL, () => HttpResponse.json([{ address: ADDR, balance: 500_000_000 }])),
    );

    const balances = await getBalance(ADDR);

    expect(balances).toEqual([{ value: 500_000_000n, asset: { type: "native", name: "KAS" } }]);
  });

  it("defaults to zero when the address is absent from the response (pristine account)", async () => {
    server.use(http.post(BALANCES_URL, () => HttpResponse.json([])));

    const [balance] = await getBalance(ADDR);

    expect(balance.value).toBe(0n);
  });

  it("throws when the endpoint returns a non-ok status", async () => {
    server.use(http.post(BALANCES_URL, () => new HttpResponse(null, { status: 500 })));

    await expect(getBalance(ADDR)).rejects.toThrow("Error fetching balance");
  });
});
