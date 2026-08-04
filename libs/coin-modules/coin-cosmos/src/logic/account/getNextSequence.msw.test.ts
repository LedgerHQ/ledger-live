import { http, HttpResponse } from "msw";
import { server, TEST_COSMOS_ENDPOINT, makeTestApi } from "../../test/msw.mock";
import { getNextSequence } from "./getNextSequence";

const ADDR = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";
const ACCOUNT = `${TEST_COSMOS_ENDPOINT}/cosmos/auth/v1beta1/accounts/${ADDR}`;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getNextSequence via MSW", () => {
  it("returns the account's on-chain sequence", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(ACCOUNT, () =>
        HttpResponse.json({
          account: {
            "@type": "/cosmos.auth.v1beta1.BaseAccount",
            address: ADDR,
            pub_key: { "@type": "/cosmos.crypto.secp256k1.PubKey", key: "AbC123==" },
            account_number: "12345",
            sequence: "42",
          },
        }),
      ),
    );

    expect(await getNextSequence(api, ADDR)).toBe(42n);
  });

  it("returns 0 for a pristine account that has never signed a transaction", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(ACCOUNT, () =>
        HttpResponse.json({
          account: {
            "@type": "/cosmos.auth.v1beta1.BaseAccount",
            address: ADDR,
            pub_key: null,
            account_number: "9999",
            sequence: "0",
          },
        }),
      ),
    );

    expect(await getNextSequence(api, ADDR)).toBe(0n);
  });

  // `CosmosAPI.getAccount` wraps its whole fetch in a try/catch and falls back to a default account
  // (sequence 0) instead of rethrowing, so a 500 resolves to the same fallback as a never-used
  // account rather than rejecting.
  it("falls back to sequence 0 (does not throw) when the accounts endpoint errors", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(http.get(ACCOUNT, () => new HttpResponse(null, { status: 500 })));

    await expect(getNextSequence(api, ADDR)).resolves.toBe(0n);
  });
});
