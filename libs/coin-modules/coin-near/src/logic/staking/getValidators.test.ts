import { getValidators as fetchValidators } from "../../network";
import { getValidators } from "./getValidators";

jest.mock("../../network", () => ({ getValidators: jest.fn() }));

describe("getValidators", () => {
  beforeEach(() => jest.clearAllMocks());

  it("maps indexer validators to the framework shape", async () => {
    (fetchValidators as unknown as jest.Mock).mockResolvedValue([
      {
        account_id: "astro-stakers.poolv1.near",
        stake: "31516203410952749364980772561846",
        commission: 1,
      },
    ]);

    const page = await getValidators();

    expect(page.items).toEqual([
      {
        address: "astro-stakers.poolv1.near",
        name: "astro-stakers.poolv1.near",
        balance: 31516203410952749364980772561846n,
        commissionRate: "1",
      },
    ]);
    expect(page.next).toBeUndefined();
  });

  it("requests the top 200 validators", async () => {
    (fetchValidators as unknown as jest.Mock).mockResolvedValue([]);

    await getValidators();

    expect(fetchValidators).toHaveBeenCalledWith({ total: 200 });
  });

  it("defaults a missing stake to zero", async () => {
    (fetchValidators as unknown as jest.Mock).mockResolvedValue([
      { account_id: "pool.poolv1.near", stake: "", commission: 0 },
    ]);

    const page = await getValidators();

    expect(page.items[0].balance).toBe(0n);
  });
});
