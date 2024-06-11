import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { TRANSACTION_DETAIL_FIXTURE, TRANSACTION_FIXTURE, TRC20_FIXTURE } from "./types.fixture";
import { setCoinConfig } from "../config";
import { fetchTronAccountTxs } from ".";

export const TRON_BASE_URL_TEST = "https://httpbin.org";

const handlers = [
  http.get(`${TRON_BASE_URL_TEST}/v1/accounts/:addr/transactions`, () => {
    // const url = new URL(request.url);
    // const _ = url.searchParams.get("get_detail");
    return HttpResponse.json(TRANSACTION_FIXTURE);
  }),
  http.get(`${TRON_BASE_URL_TEST}/v1/accounts/:addr/transactions/trc20`, () => {
    // const url = new URL(request.url);
    // const _ = url.searchParams.get("get_detail");
    return HttpResponse.json(TRC20_FIXTURE);
  }),
  http.get(`${TRON_BASE_URL_TEST}/wallet/gettransactioninfobyid`, ({ request }) => {
    const url = new URL(request.url);
    const value = url.searchParams.get("value") ?? "UNKNOWN";
    return HttpResponse.json(TRANSACTION_DETAIL_FIXTURE(value));
  }),
];

const mockServer = setupServer(...handlers);

describe("fetchTronAccountTxs", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: TRON_BASE_URL_TEST,
      },
    }));

    mockServer.listen();
  });

  beforeEach(() => {
    mockServer.resetHandlers();
  });

  afterAll(() => {
    mockServer.close();
  });

  it("convert correctly operations from the blockchain", async () => {
    // WHEN
    const results = await fetchTronAccountTxs("ADDRESS", txs => txs.length < 100, {});

    // THEN
    expect(results).toContainEqual(
      // expect.arrayContaining([
        expect.objectContaining({
          blockHeight: 62258698,
          // date: new Date("2024-06-03T13:03:12.000Z"),
          // date: expect.any(Date),
          date: "2024-06-03T13:03:12.000Z",
          fee: "0",
          from: "TQ7pF3NTDL2Tjz5rdJ6ECjQWjaWHpLZJMH",
          hasFailed: false,
          to: "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj",
          tokenId: undefined,
          txID: "47086db397eac45d2fe7dacedcb6f77267d6895dce645210e495e64f8a2a7910",
          type: "TransferContract",
          value: "5",
        }),
        // expect.objectContaining({"blockHeight": 62258696, "date": new Date("2024-06-03T13:03:06.000Z"), "fee": "0", "from": "TE6fbAMXq7WbsHvxViZPJtF9nB92EmuJMH", "hasFailed": false, "to": "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj", "tokenId": undefined, "txID": "37c2bfbd2324e68588745ff34de0cc64c9ce6704e52ebee31410617e1c99e38d", "type": "TransferContract", "value": "1"}),
        // expect.objectContaining({"blockHeight": 62258685, "date": new Date("2024-06-03T13:02:33.000Z"), "fee": "0", "from": "TH7EmBWnTLpj945Kw6XedesJRTUrc5EjJc", "hasFailed": false, "to": "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj", "tokenId": undefined, "txID": "3de7821163ac008e1760cd1e2596f927af679510f784bdb4249580f946e805cd", "type": "TransferContract", "value": "1"}),
        // expect.objectContaining({"blockHeight": 62258680, "date": new Date("2024-06-03T13:02:18.000Z"), "fee": "0", "from": "TPowXTTbKq9joZ8jy2SXbu8ByoozrucJMH", "hasFailed": false, "to": "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj", "tokenId": undefined, "txID": "37966e8d22d5f5e0b21af47ec364562d88d883000cc1d92192acb1109b48db26", "type": "TransferContract", "value": "5"}),
        // expect.objectContaining({"blockHeight": 62258673, "date": new Date("2024-06-03T13:01:57.000Z"), "fee": "1100000", "from": "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj", "hasFailed": false, "to": "TXsTVwrkJ8UGYtWY1Xk6MrzyCekw8TzJMH", "tokenId": undefined, "txID": "b0b68ea41e7b46f06196ea0ff47837afe821f985eb966a4915eb3809ac893461", "type": "TransferContract", "value": "100000000"}),
        // expect.objectContaining({"blockHeight": 61876582, "date": new Date("2024-05-21T06:29:24.000Z"), "fee": "0", "from": "TUgvEatU7yEY1ovrjtFMHRmoBcULi91gKK", "hasFailed": false, "to": "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj", "tokenId": undefined, "txID": "ab5fe577de8119b6148aefcadd97722ff7d231ba004604a464118e7561c30b08", "type": "TransferContract", "value": "5"}),
        // expect.objectContaining({"blockHeight": 61876580, "date": new Date("2024-05-21T06:29:18.000Z"), "fee": "0", "from": "TBLQwhNVwJpby48UZYXTQKurJJtyeLagKK", "hasFailed": false, "to": "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj", "tokenId": undefined, "txID": "2e8712749bbc844d6b19bd8c4855606d05bed75ab2a9770e898aca5dfb583a1c", "type": "TransferContract", "value": "1"}),
        // expect.objectContaining({"blockHeight": 61876557, "date": new Date("2024-05-21T06:28:09.000Z"), "fee": "0", "from": "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj", "hasFailed": false, "to": "TQq4YrKRywkd9vLYw2nZKiFfMpbQiL8gKK", "tokenId": undefined, "txID": "adc3f1c4cf23d4adfcf25d3cdae5378d86a209b7b9d49d69db47cae7f838c5f0", "type": "TransferContract", "value": "2000000"}),
        // expect.objectContaining({"blockHeight": 60130921, "date": new Date("2024-03-21T15:08:18.000Z"), "fee": "0", "from": "TFPHhbNoWwNbqSdFEFPwHzv1p92j71CgKK", "hasFailed": false, "to": "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj", "tokenId": undefined, "txID": "0f9151ed85e6a49c063dc9fc51c90c2cbc35b926b87c4018383dd7677b59d876", "type": "TransferContract", "value": "4"}),
        // expect.objectContaining({"blockHeight": 60130899, "date": new Date("2024-03-21T15:07:12.000Z"), "fee": "0", "from": "TGVpmGotMR98Ap2FYatMCkHAmZjBntggKK", "hasFailed": false, "to": "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj", "tokenId": undefined, "txID": "ba104de7af21648e2803d18e7045f3184f6bc6472532990480577837f56f747c", "type": "TransferContract", "value": "5"}),
      // ]),
    );
  });
});
