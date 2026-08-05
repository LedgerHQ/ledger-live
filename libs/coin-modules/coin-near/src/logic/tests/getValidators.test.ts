import { http, HttpResponse } from "msw";
import { setMockCoinConfig } from "../../test/coinConfig";
import { mockServer, NEAR_BASE_URL_MOCKED } from "../../network/node.mock";
import { getValidators as fetchValidators } from "../../network";
import { getValidators } from "../getValidators";

describe("getValidators (MSW)", () => {
  beforeAll(() => {
    setMockCoinConfig();
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => fetchValidators.reset());
  afterEach(() => mockServer.resetHandlers());
  afterAll(() => mockServer.close());

  it("maps the indexer's validators into a single, unpaginated page", async () => {
    mockServer.use(
      http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () =>
        HttpResponse.json({
          data: [
            {
              account_id: "astro-stakers.poolv1.near",
              current_epoch_stake: "31516203410952749364980772561846",
              fee_numerator: 1,
              fee_denominator: 100,
            },
          ],
        }),
      ),
    );

    const page = await getValidators();

    expect(page.next).toBeUndefined();
    expect(page.items).toEqual([
      {
        address: "astro-stakers.poolv1.near",
        name: "astro-stakers.poolv1.near",
        balance: 31516203410952749364980772561846n,
        commissionRate: "1",
      },
    ]);
  });

  it("returns an empty page rather than undefined items when the indexer has no data", async () => {
    mockServer.use(
      http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () => HttpResponse.json({ data: null })),
    );

    const page = await getValidators();

    expect(page.items).toEqual([]);
  });
});
