import { http, HttpResponse } from "msw";
import { TEST_STACKS_ENDPOINT, server } from "../../test/msw.mock";
import { lastBlock } from "./lastBlock";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("lastBlock via MSW", () => {
  it("fetches the tip, then falls back to the tip's previous block by height", async () => {
    server.use(
      http.get(`${TEST_STACKS_ENDPOINT}/extended/v2/blocks/latest`, () =>
        HttpResponse.json({
          height: 961566,
          hash: "0xtipblockhash",
          tenure_height: 40123,
          burn_block_time: 1755000000,
          canonical: true,
        }),
      ),
      http.get(`${TEST_STACKS_ENDPOINT}/extended/v2/blocks/961565`, () =>
        HttpResponse.json({
          height: 961565,
          hash: "0xpreviousblockhash",
          tenure_height: 40123,
          burn_block_time: 1754999995,
          canonical: true,
        }),
      ),
    );

    await expect(lastBlock()).resolves.toEqual({
      height: 961565,
      hash: "0xpreviousblockhash",
      time: new Date(1754999995 * 1000),
    });
  });
});
