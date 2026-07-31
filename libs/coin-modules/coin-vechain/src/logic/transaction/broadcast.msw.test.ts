import { http, HttpResponse } from "msw";
import { server, TEST_VECHAIN_ENDPOINT } from "../../test/msw.mock";
import { broadcast } from "./broadcast";

const SUBMIT_URL = `${TEST_VECHAIN_ENDPOINT}/transactions`;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("broadcast via MSW", () => {
  it("submits the signed raw transaction and returns the transaction id", async () => {
    server.use(http.post(SUBMIT_URL, () => HttpResponse.json({ id: "0xtxid" })));

    expect(await broadcast("0xaabbcc")).toBe("0xtxid");
  });

  it("throws on an HTTP 200 whose body carries no transaction id (never swallows an error body)", async () => {
    server.use(http.post(SUBMIT_URL, () => HttpResponse.json({})));

    await expect(broadcast("0xaabbcc")).rejects.toThrow("Expected an ID to be returned");
  });
});
