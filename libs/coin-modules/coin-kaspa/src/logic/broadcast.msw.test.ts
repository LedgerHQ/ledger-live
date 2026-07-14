import { http, HttpResponse } from "msw";
import { TEST_KASPA_ENDPOINT, server } from "../test/msw.mock";
import { broadcast } from "./broadcast";

const SUBMIT_URL = `${TEST_KASPA_ENDPOINT}/transactions`;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("broadcast via MSW", () => {
  it("submits the raw transaction and returns the transaction id", async () => {
    server.use(http.post(SUBMIT_URL, () => HttpResponse.json({ transactionId: "abc123" })));

    expect(await broadcast("raw-signed-tx")).toBe("abc123");
  });

  it("throws when the submit response carries no transaction id", async () => {
    server.use(http.post(SUBMIT_URL, () => HttpResponse.json({})));

    await expect(broadcast("raw-signed-tx")).rejects.toThrow(
      "kaspa: broadcast returned no transaction id",
    );
  });
});
