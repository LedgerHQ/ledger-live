import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TON_API_MOCKED, createMockTonContext } from "../../test/context";
import { OWNER } from "../../test/history.fixtures";
import { getNextSequence } from "../getNextSequence";

describe("getNextSequence", () => {
  const server = setupServer();
  const context = createMockTonContext();

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("returns the seqno of an active wallet", async () => {
    server.use(
      http.get(`${TON_API_MOCKED}/wallet`, () =>
        HttpResponse.json({ balance: "916991005", seqno: 3, status: "active" }),
      ),
    );

    await expect(getNextSequence(context, OWNER)).resolves.toBe(3n);
  });

  it("starts an uninitialised wallet at 0", async () => {
    server.use(
      http.get(`${TON_API_MOCKED}/wallet`, () =>
        HttpResponse.json({ balance: "0", status: "uninit" }),
      ),
    );

    await expect(getNextSequence(context, OWNER)).resolves.toBe(0n);
  });
});
