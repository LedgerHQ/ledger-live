import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { http, HttpResponse } from "msw";
import { server, TEST_COSMOS_ENDPOINT, makeTestApi } from "../../test/msw.mock";
import { estimateFees } from "./estimateFees";

const SENDER = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";
const ACCOUNTS = `${TEST_COSMOS_ENDPOINT}/cosmos/auth/v1beta1/accounts/${SENDER}`;
const SIMULATE = `${TEST_COSMOS_ENDPOINT}/cosmos/tx/v1beta1/simulate`;

const sendIntent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: "cosmos1recipient00000000000000000000000000",
  amount: 1_000_000n,
  asset: { type: "native" },
} as unknown as TransactionIntent;

const ACCOUNT_RESPONSE = {
  account: {
    "@type": "/cosmos.auth.v1beta1.BaseAccount",
    address: SENDER,
    pub_key: { "@type": "/cosmos.crypto.secp256k1.PubKey", key: "AtestPubKeyBase64=" },
    account_number: "12",
    sequence: "5",
  },
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("estimateFees via MSW", () => {
  it("maps the simulated gas to value + parameters.gasLimit", async () => {
    // estimateFees reads the denom off the passed api (offline getCurrency); the network simulate
    // still resolves its host from the runtime coinConfig, which makeTestApi's setCoinConfig sets.
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(ACCOUNTS, () => HttpResponse.json(ACCOUNT_RESPONSE)),
      http.post(SIMULATE, () => HttpResponse.json({ gas_info: { gas_used: "80000" } })),
    );

    const fees = await estimateFees(api, sendIntent);

    // gasWanted = ceil(gasUsed(80000) * COSMOS_GAS_AMPLIFIER(1.3)) = 104000
    // value = ceil(gasWanted(104000) * minGasPrice(0.025)) = 2600
    expect(fees.parameters?.gasLimit).toBe("104000");
    expect(fees.value).toBe(2600n);
  });

  // getEstimatedFees wraps cosmosAPI.simulate in its own try/catch that only logs and falls back to
  // chainInstance.defaultGas (100000), so a simulate failure never rejects — estimateFees returns the
  // default-gas estimate instead.
  it("does not throw when simulate fails — falls back to the chain default gas", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(ACCOUNTS, () => HttpResponse.json(ACCOUNT_RESPONSE)),
      http.post(SIMULATE, () => new HttpResponse(null, { status: 500 })),
    );

    const fees = await estimateFees(api, sendIntent);

    // gasWanted = ceil(defaultGas(100000) * 1.3) = 130000; value = ceil(130000 * 0.025) = 3250
    expect(fees.parameters?.gasLimit).toBe("130000");
    expect(fees.value).toBe(3250n);
  });

  // CosmosAPI.getAccount wraps its request in its own try/catch and returns default account data on
  // any failure, so an account-lookup failure degrades the same way — never rejecting estimateFees.
  it("does not throw when the account lookup fails — falls back to default account data", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(ACCOUNTS, () => new HttpResponse(null, { status: 500 })),
      http.post(SIMULATE, () => HttpResponse.json({ gas_info: { gas_used: "80000" } })),
    );

    const fees = await estimateFees(api, sendIntent);

    expect(fees.parameters?.gasLimit).toBe("104000");
    expect(fees.value).toBe(2600n);
  });
});
