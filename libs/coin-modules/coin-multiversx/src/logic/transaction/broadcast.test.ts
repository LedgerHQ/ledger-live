import { http, HttpResponse } from "msw";
import { broadcast } from "./broadcast";
import { server, useMswServer, testNetworkApi, TEST_API } from "../tests/msw";

describe("broadcast (msw)", () => {
  useMswServer();

  it("posts the signed transaction and returns the txHash", async () => {
    server.use(
      http.post(`${TEST_API}/transaction/send`, () =>
        HttpResponse.json({ data: { txHash: "deadbeefcafe" } }),
      ),
    );

    const hash = await broadcast(testNetworkApi(), JSON.stringify({ signature: "ab" }));

    expect(hash).toBe("deadbeefcafe");
  });

  it("throws when the gateway returns 200 without a txHash", async () => {
    server.use(
      http.post(`${TEST_API}/transaction/send`, () => HttpResponse.json({ data: { txHash: "" } })),
    );

    await expect(broadcast(testNetworkApi(), JSON.stringify({ signature: "ab" }))).rejects.toThrow(
      "txHash",
    );
  });
});
