import type { DelegatedStake } from "@mysten/sui/jsonRpc";
import { getAllBalancesCached, getDelegatedStakes } from "../network";
import { getBalance } from "./getBalance";

jest.mock("../network", () => ({
  getAllBalancesCached: jest.fn().mockResolvedValue([
    { coinType: "0x2::sui::SUI", totalBalance: 1000000000 },
    { coinType: "0x3::usdt::USDT", totalBalance: 500000000 },
  ]),
  getDelegatedStakes: jest.fn().mockResolvedValue([]),
}));

const mockedGetDelegatedStakes = jest.mocked(getDelegatedStakes);

describe("getBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the correct native SUI balance", async () => {
    const address = "0x123";
    const result = await getBalance(address);

    expect(result[0]).toMatchObject({
      value: BigInt(1000000000),
      asset: { type: "native" },
    });
  });

  it("should return the correct USDT token balance", async () => {
    const address = "0x123";
    const result = await getBalance(address);

    expect(result[1]).toMatchObject({
      value: BigInt(500000000),
      asset: { type: "token", assetReference: "0x3::usdt::USDT" },
    });
  });

  it("should return staking balances when delegations are available", async () => {
    const mockDelegations: DelegatedStake[] = [
      {
        validatorAddress: "0xvalidator1",
        stakingPool: "0xpool1",
        stakes: [
          {
            stakedSuiId: "stake_1",
            stakeActiveEpoch: "1",
            stakeRequestEpoch: "0",
            principal: "2000000000",
            status: "Active",
            estimatedReward: "0",
          },
        ],
      },
    ];

    mockedGetDelegatedStakes.mockResolvedValueOnce(mockDelegations);

    const address = "0x123";
    const result = await getBalance(address);

    expect(getAllBalancesCached).toHaveBeenCalledWith(address, undefined);
    expect(getDelegatedStakes).toHaveBeenCalledWith(address, undefined);
    expect(result).toHaveLength(3);

    expect(result[2]).toMatchObject({
      value: BigInt(2000000000),
      asset: { type: "native" },
      stake: {
        uid: "stake_1",
        address: "0x123",
        delegate: "0xvalidator1",
        state: "active",
        asset: { type: "native" },
        amount: BigInt(2000000000),
        amountDeposited: BigInt(2000000000),
        amountRewarded: BigInt(0),
      },
    });
  });
});
