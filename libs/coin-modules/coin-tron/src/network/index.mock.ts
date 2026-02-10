import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import fetchAccountFixture from "./fixtures/fetchAccount.fixture.json";
import fetchTronAccountTxs from "./fixtures/fetchTronAccountTxs.fixture.json";
import fetchTronAccountTrc20Txs from "./fixtures/fetchTronAccountTxsTrc20.fixture.json";
import getAccountResource from "./fixtures/getAccountResource.fixture.json";
import getTransactionInfoById from "./fixtures/getTransactionInfoById.fixture.json";

// This URL can also be find in the fixture with pagination, so there can be a consistency with paginated requests.
export const TRONGRID_BASE_URL_MOCKED = "https://api.mock.trongrid.io";

const handlers = [
  http.get(`${TRONGRID_BASE_URL_MOCKED}/v1/accounts/:address`, ({ params }) => {
    const address: string =
      typeof params.address === "string" ? params.address : params.address?.[0] ?? "";
    const response = (fetchAccountFixture as Record<string, object>)[address];

    if (!response) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(response);
  }),
  http.get(
    `${TRONGRID_BASE_URL_MOCKED}/v1/accounts/:address/transactions`,
    ({ params, request }) => {
      const address: string =
        typeof params.address === "string" ? params.address : params.address?.[0] ?? "";
      const response = (fetchTronAccountTxs as Record<string, Record<string, object>>)[address];

      const url = new URL(request.url);
      const fingerprint = (url.searchParams.get("fingerprint") as string) ?? "";

      if (!response) {
        return new HttpResponse(null, { status: 404 });
      }

      return HttpResponse.json(response[fingerprint]);
    },
  ),
  http.get(`${TRONGRID_BASE_URL_MOCKED}/v1/accounts/:address/transactions/trc20`, ({ params }) => {
    const address: string =
      typeof params.address === "string" ? params.address : params.address?.[0] ?? "";
    const response = (fetchTronAccountTrc20Txs as Record<string, object>)[address];

    if (!response) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(response);
  }),
  http.get(`${TRONGRID_BASE_URL_MOCKED}/wallet/getnowblock`, () => {
    return HttpResponse.json({
      blockID: "00000000042676341cfaf5c785ad75a90b88e9f75407e909decdcb857afed099",
      block_header: {
        raw_data: {
          number: 69629492,
          txTrieRoot: "95ea9c4c04a4d0145b9a1d9658636f0ee1084d3026ac5a644a7ababfd2a3276a",
          witness_address: "41d376d829440505ea13c9d1c455317d51b62e4ab6",
          parentHash: "00000000042676336ee51411bd47bc68df4b2a89f0c1cc9347b98d70d00a5640",
          version: 31,
          timestamp: 1739540559000,
        },
        witness_signature:
          "26f2fcb0a80c2731a00387ba753e162e9161db1bd3ab4ec61eb4d4b70d5983fc00f6edb117d4fb1d0624ac728da3b1f60e011b76fa95a490455ffb1c42593ea101",
      },
    });
  }),
  http.get(`${TRONGRID_BASE_URL_MOCKED}/wallet/gettransactioninfobyid`, ({ request }) => {
    const url = new URL(request.url);
    const txID = url.searchParams.get("value") as string;
    const response = (getTransactionInfoById as Record<string, object>)[txID];
    if (!response) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(response);
  }),
  http.get(`${TRONGRID_BASE_URL_MOCKED}/wallet/getaccountresource*`, ({ request }) => {
    const url = new URL(request.url);
    const address = url.searchParams.get("address") as string;
    const response = (getAccountResource as Record<string, object>)[address];
    if (!response) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(response);
  }),
  http.get(`${TRONGRID_BASE_URL_MOCKED}/wallet/getReward*`, () => {
    return HttpResponse.json({
      reward: 1802573,
    });
  }),
];

export const mockServer = setupServer(...handlers);
