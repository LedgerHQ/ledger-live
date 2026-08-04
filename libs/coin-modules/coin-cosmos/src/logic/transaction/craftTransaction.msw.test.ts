import { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { http, HttpResponse } from "msw";
import { server, TEST_COSMOS_ENDPOINT, makeTestApi } from "../../test/msw.mock";
import { craftTransaction, CosmosCraftedTransaction } from "./craftTransaction";

const SENDER = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";
const RECIPIENT = "cosmos1recipient00000000000000000000000000";
const ACCOUNTS = `${TEST_COSMOS_ENDPOINT}/cosmos/auth/v1beta1/accounts/${SENDER}`;
const SIMULATE = `${TEST_COSMOS_ENDPOINT}/cosmos/tx/v1beta1/simulate`;
const NODE_INFO = `${TEST_COSMOS_ENDPOINT}/cosmos/base/tendermint/v1beta1/node_info`;

const sendIntent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
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
const NODE_INFO_RESPONSE = { default_node_info: { network: "cosmoshub-4" } };

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("craftTransaction via MSW", () => {
  it("crafts a send payload, estimating fees via simulate when no customFees is given", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(ACCOUNTS, () => HttpResponse.json(ACCOUNT_RESPONSE)),
      http.post(SIMULATE, () => HttpResponse.json({ gas_info: { gas_used: "80000" } })),
      http.get(NODE_INFO, () => HttpResponse.json(NODE_INFO_RESPONSE)),
    );

    const crafted = await craftTransaction(api, "cosmos", sendIntent);
    const payload = JSON.parse(crafted.transaction) as CosmosCraftedTransaction;

    expect(payload.protoMsgs).toHaveLength(1);
    expect(payload.protoMsgs[0].typeUrl).toBe("/cosmos.bank.v1beta1.MsgSend");
    expect(payload.sequence).toBe("5");
    expect(payload.accountNumber).toBe("12");
    expect(payload.chainId).toBe("cosmoshub-4");
    // Same estimate math verified in estimateFees.msw.test.ts: ceil(80000*1.3)=104000 gas,
    // ceil(104000*0.025)=2600 fee.
    expect(payload.gasLimit).toBe("104000");
    expect(payload.feeAmount).toEqual([{ denom: "uatom", amount: "2600" }]);
    expect(payload.signable.length).toBeGreaterThan(0);
  });

  it("skips fee estimation (no simulate call) when customFees is provided", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    // No SIMULATE handler registered: onUnhandledRequest:"error" would fail this test if
    // craftTransaction still called estimateFees/simulate despite customFees being supplied.
    server.use(
      http.get(ACCOUNTS, () => HttpResponse.json(ACCOUNT_RESPONSE)),
      http.get(NODE_INFO, () => HttpResponse.json(NODE_INFO_RESPONSE)),
    );
    const customFees: FeeEstimation = { value: 500n, parameters: { gasLimit: "200000" } };

    const crafted = await craftTransaction(api, "cosmos", sendIntent, customFees);
    const payload = JSON.parse(crafted.transaction) as CosmosCraftedTransaction;

    expect(payload.gasLimit).toBe("200000");
    expect(payload.feeAmount).toEqual([{ denom: "uatom", amount: "500" }]);
  });

  // getAccount and simulate both swallow failures (see estimateFees.msw.test.ts), but getNodeInfo has
  // no try/catch — it's the one call in craftTransaction's flow whose failure propagates as a rejection.
  it("throws when the node_info lookup fails", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(ACCOUNTS, () => HttpResponse.json(ACCOUNT_RESPONSE)),
      http.post(SIMULATE, () => HttpResponse.json({ gas_info: { gas_used: "80000" } })),
      http.get(NODE_INFO, () => new HttpResponse(null, { status: 500 })),
    );

    await expect(craftTransaction(api, "cosmos", sendIntent)).rejects.toThrow();
  });
});
