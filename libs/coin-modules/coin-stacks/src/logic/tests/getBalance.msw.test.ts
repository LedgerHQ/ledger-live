import { http, HttpResponse } from "msw";
import { TEST_STACKS_ENDPOINT, server } from "../../test/msw.mock";
import { getBalance } from "../getBalance";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ADDRESS = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";

describe("getBalance via MSW", () => {
  it("returns native + token balances from the real HTTP response shapes", async () => {
    server.use(
      http.get(`${TEST_STACKS_ENDPOINT}/extended/v2/addresses/${ADDRESS}/balances/stx`, () =>
        HttpResponse.json({
          balance: "1000000",
          total_miner_rewards_received: "0",
          lock_tx_id: "",
          locked: "0",
          lock_height: 0,
          burnchain_lock_height: 0,
          burnchain_unlock_height: 0,
        }),
      ),
      http.get(`${TEST_STACKS_ENDPOINT}/extended/v2/addresses/${ADDRESS}/balances/ft`, () =>
        HttpResponse.json({
          limit: 50,
          offset: 0,
          total: 1,
          results: [{ token: "SP_CONTRACT.token-x::token-x", balance: "5000" }],
        }),
      ),
    );

    const balances = await getBalance(ADDRESS);

    expect(balances).toEqual([
      { value: 1000000n, asset: { type: "native", name: "STX" } },
      {
        value: 5000n,
        asset: {
          type: "token",
          assetReference: "sp_contract.token-x::token-x",
          assetOwner: ADDRESS,
          name: "sp_contract.token-x::token-x",
        },
      },
    ]);
  });
});
