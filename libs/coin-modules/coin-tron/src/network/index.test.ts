import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { TRANSACTION_DETAIL_FIXTURE, TRANSACTION_FIXTURE, TRC20_FIXTURE } from "./types.fixture";
import coinConfig from "../config";
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
    coinConfig.setCoinConfig(() => ({
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
    const tx = results.find(tx => tx.blockHeight === 62258698);
    expect(tx).toBeDefined();
    expect(tx!.from).toEqual("TQ7pF3NTDL2Tjz5rdJ6ECjQWjaWHpLZJMH");
    expect(tx!.to).toEqual("TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj");
  });
});
