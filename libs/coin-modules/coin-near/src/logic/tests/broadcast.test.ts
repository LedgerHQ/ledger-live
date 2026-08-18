import { mockNearContext } from "../../test/context";
import { http, HttpResponse } from "msw";
import { setMockCoinConfig } from "../../test/coinConfig";
import { mockServer, NEAR_BASE_URL_MOCKED } from "../../network/node.mock";
import { broadcast } from "../broadcast";

describe("broadcast (MSW)", () => {
  beforeAll(() => {
    setMockCoinConfig();
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => mockServer.resetHandlers());
  afterAll(() => mockServer.close());

  it("submits the signed transaction and returns the hash the node assigns", async () => {
    let sentPayload: string | undefined;
    mockServer.use(
      http.post(NEAR_BASE_URL_MOCKED, async ({ request }) => {
        const body = (await request.json()) as { params: { signed_tx_base64: string } };
        sentPayload = body.params.signed_tx_base64;
        return HttpResponse.json({
          jsonrpc: "2.0",
          id: "id",
          result: { transaction: { hash: "GkQ7Uh8oPPGtVfyPz1yLKmqPqZ8ZyxvGtN5MmYq8mF1w" } },
        });
      }),
    );

    await expect(broadcast(mockNearContext, "ZmFrZS1zaWduZWQtdHg=")).resolves.toBe(
      "GkQ7Uh8oPPGtVfyPz1yLKmqPqZ8ZyxvGtN5MmYq8mF1w",
    );
    expect(sentPayload).toBe("ZmFrZS1zaWduZWQtdHg=");
  });

  it("surfaces the node's error instead of a hash on an HTTP-200 failure body", async () => {
    mockServer.use(
      http.post(NEAR_BASE_URL_MOCKED, () =>
        HttpResponse.json({
          jsonrpc: "2.0",
          id: "id",
          error: { cause: { name: "INVALID_TRANSACTION" }, message: "nonce too small" },
        }),
      ),
    );

    await expect(broadcast(mockNearContext, "ZmFrZS1zaWduZWQtdHg=")).rejects.toThrow(
      "INVALID_TRANSACTION: nonce too small",
    );
  });
});
