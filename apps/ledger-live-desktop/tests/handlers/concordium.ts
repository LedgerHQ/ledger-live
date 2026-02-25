import { http, HttpResponse, ws } from "msw";

const CONCORDIUM_PROXY_URLS = [
  "https://ccd-wallet-proxy-mainnet.coin.ledger.com",
  "https://ccd-wallet-proxy-testnet.coin.ledger-test.com",
];

const wcRelay = ws.link("wss://relay.walletconnect.com");

const handlers = [
  ...CONCORDIUM_PROXY_URLS.flatMap(baseUrl => [
    http.put(`${baseUrl}/v0/submitCredential/`, () => {
      return HttpResponse.json({ submissionId: "test-submission-id" });
    }),
  ]),
  wcRelay.addEventListener("connection", ({ client }) => {
    client.addEventListener("message", (event: MessageEvent) => {
      try {
        const data = JSON.parse(String(event.data)) as {
          id?: string | number;
          jsonrpc?: string;
          method?: string;
          params?: unknown;
        };
        if (data.jsonrpc === "2.0" && data.id != null) {
          let result: unknown = true;
          if (data.method === "irn_subscribe") {
            result = `mock-sub-${data.id}`;
          } else if (data.method === "irn_batchSubscribe") {
            result =
              (data.params as { topics?: string[] })?.topics?.map(() => `mock-sub-${data.id}`) ??
              [];
          } else if (data.method === "irn_fetchMessages") {
            result = { messages: [], hasMore: false };
          } else if (data.method === "irn_batchFetchMessages") {
            result = { messages: [], hasMore: false };
          }
          client.send(JSON.stringify({ id: data.id, jsonrpc: "2.0", result }));
        }
      } catch {
        // Non-JSON or invalid messages ignored
      }
    });
  }),
];

export default handlers;
