import { getEnv } from "@ledgerhq/live-env";
import * as network from "@ledgerhq/live-network";
import { getValidators } from "../getValidators";

jest.spyOn({ getEnv }, "getEnv").mockImplementation((key: string) => {
  const urls: Record<string, string> = {
    SOLANA_VALIDATORS_SUMMARY_BASE_URL:
      "https://earn-dashboard.aws.stg.ldg-tech.com/figment/solana/validators_summary",
  };
  return urls[key] ?? "";
});

const VALIDATORS_URL = "https://validators-solana.coin.ledger.com/api/v1/validators/mainnet.json";

describe("getValidators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns the upstream list mapped to framework Validators with APY", async () => {
    jest
      .spyOn(network, "default")
      .mockResolvedValueOnce({
        status: 200,
        data: [
          {
            vote_account: "VoteAccountB1111111111111111111111111111111",
            name: "Validator B",
            active_stake: 500_000_000,
            commission: 100,
            total_score: 1,
            delinquent: false,
          },
          {
            vote_account: "VoteAccountA1111111111111111111111111111111",
            name: "Validator A",
            avatar_url: "https://example.com/a.png",
            www_url: "https://example.com/a",
            active_stake: 1_000_000_000,
            commission: 5,
            total_score: 9,
            delinquent: false,
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        data: [
          {
            address: "VoteAccountA1111111111111111111111111111111",
            delegator_apy: 0.07,
            name: "A",
          },
        ],
      });

    const page = await getValidators(VALIDATORS_URL);

    expect(page).toStrictEqual({
      next: undefined,
      items: [
        {
          address: "VoteAccountB1111111111111111111111111111111",
          name: "Validator B",
          url: undefined,
          logo: undefined,
          balance: BigInt(500_000_000),
          commissionRate: "100",
          apy: undefined,
        },
        {
          address: "VoteAccountA1111111111111111111111111111111",
          name: "Validator A",
          url: "https://example.com/a",
          logo: "https://example.com/a.png",
          balance: BigInt(1_000_000_000),
          commissionRate: "5",
          apy: 0.07,
        },
      ],
    });
  });

  it("falls back to the vote account when name is missing", async () => {
    jest
      .spyOn(network, "default")
      .mockResolvedValueOnce({
        status: 200,
        data: [
          {
            vote_account: "Unnamed1111111111111111111111111111111111111",
            active_stake: 2_000_000_000,
            commission: 3,
            total_score: 5,
            delinquent: false,
          },
        ],
      })
      .mockResolvedValueOnce({ status: 200, data: [] });

    const page = await getValidators(VALIDATORS_URL);

    expect(page).toMatchObject({
      items: [{ name: "Unnamed1111111111111111111111111111111111111" }],
    });
  });

  it("drops delinquent and incomplete entries", async () => {
    jest
      .spyOn(network, "default")
      .mockResolvedValueOnce({
        status: 200,
        data: [
          {
            vote_account: "Delinquent11111111111111111111111111111111111",
            active_stake: 1,
            commission: 9,
            total_score: 1,
            delinquent: true,
          },
          {
            vote_account: "Incomplete11111111111111111111111111111111111",
            active_stake: null,
            commission: 5,
            total_score: 5,
            delinquent: false,
          },
        ],
      })
      .mockResolvedValueOnce({ status: 200, data: [] });

    const page = await getValidators(VALIDATORS_URL);

    expect(page).toStrictEqual({ items: [], next: undefined });
  });

  it("returns an empty page when no validatorsUrl is provided", async () => {
    const networkSpy = jest.spyOn(network, "default");

    const page = await getValidators();

    expect(page).toStrictEqual({ items: [], next: undefined });
    expect(networkSpy).not.toHaveBeenCalled();
  });
});
