import BigNumber from "bignumber.js";
import { getRedelegations } from "./getRedelegations";

const mockGetRedelegationsWithQueued = jest.fn();
jest.mock("../../network/Cosmos", () => ({
  CosmosAPI: jest.fn().mockImplementation(() => ({
    getRedelegationsWithQueued: mockGetRedelegationsWithQueued,
  })),
}));

describe("logic/staking/getRedelegations", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns executed + queued redelegations from the network layer", async () => {
    const redelegations = [
      {
        validatorSrcAddress: "cosmosvaloper1src",
        validatorDstAddress: "cosmosvaloper1dst",
        amount: new BigNumber("1000000"),
        completionDate: new Date("2026-01-01T00:00:00Z"),
      },
    ];
    mockGetRedelegationsWithQueued.mockResolvedValue(redelegations);

    const result = await getRedelegations("cosmos", "uatom", "cosmos1a");

    expect(result).toEqual(redelegations);
    expect(mockGetRedelegationsWithQueued).toHaveBeenCalledWith("cosmos1a", "uatom");
  });

  it("returns an empty array when the account has no redelegations", async () => {
    mockGetRedelegationsWithQueued.mockResolvedValue([]);
    expect(await getRedelegations("cosmos", "uatom", "cosmos1a")).toEqual([]);
  });
});
