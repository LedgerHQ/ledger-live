import type { Stake } from "@ledgerhq/coin-framework/api/types";
import { getAllBalancesCached, getStakes } from "../network";
import { getBalance } from "./getBalance";

jest.mock("../network", () => ({
  getAllBalancesCached: jest.fn().mockResolvedValue([
    { coinType: "0x2::sui::SUI", totalBalance: 1000000000 },
    { coinType: "0x3::usdt::USDT", totalBalance: 500000000 },
  ]),
  getStakes: jest.fn().mockResolvedValue([]),
}));

const mockedGetStakes = jest.mocked(getStakes);

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

  it("should return staking balances when stakes are available", async () => {
    const mockStakes: Stake[] = [
      {
        uid: "stake_1",
        address: "0x123",
        delegate: "0xvalidator1",
        state: "active",
        asset: { type: "native" },
        amount: BigInt(2000000000),
      },
    ];

    mockedGetStakes.mockResolvedValueOnce(mockStakes);

    const address = "0x123";
    const result = await getBalance(address);

    expect(getAllBalancesCached).toHaveBeenCalledWith(address);
    expect(getStakes).toHaveBeenCalledWith(address);
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
      },
    });
  });
});
