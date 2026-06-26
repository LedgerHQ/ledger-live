import { broadcast } from "./broadcast";
import { createTestApiClient, errorResponse, mvxHandlers, server } from "./helpers/msw-http.mock";

const api = createTestApiClient();
const ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

const SIGNED_TX = JSON.stringify({
  nonce: 42,
  value: "1000000000000000000",
  receiver: ADDRESS,
  sender: ADDRESS,
  gasPrice: 1000000000,
  gasLimit: 50000,
  chainID: "1",
  version: 1,
  options: 1,
  signature: "a".repeat(128),
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("broadcast (MSW integration)", () => {
  it("submits the signed transaction and returns the txHash from the API", async () => {
    let submitted: unknown;
    server.use(
      ...mvxHandlers({
        submit: ({ body }) => {
          submitted = body;
          return { data: { txHash: "hash-abc-123" } };
        },
      }),
    );

    const hash = await broadcast(SIGNED_TX, api);

    expect(hash).toBe("hash-abc-123");
    // The client splits `signature` out into the top level and posts the rest as rawData.
    expect(submitted).toMatchObject({
      nonce: 42,
      value: "1000000000000000000",
      signature: "a".repeat(128),
    });
  });

  it("wraps HTTP errors from the transaction/send endpoint", async () => {
    server.use(...mvxHandlers({ submit: () => errorResponse(400, { error: "bad tx" }) }));

    await expect(broadcast(SIGNED_TX, api)).rejects.toThrow(/Transaction broadcast failed:/);
  });

  it("rejects malformed JSON before any network call", async () => {
    await expect(broadcast("not json", api)).rejects.toThrow(
      "Invalid signed transaction: malformed JSON",
    );
  });
});
