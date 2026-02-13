jest.mock("../../api");

import BigNumber from "bignumber.js";
import { fetchAccountBalance, fetchNetworkStatus } from "../../api";
import { getAccount } from "./getAccount";

const mockFetchNetworkStatus = fetchNetworkStatus as jest.MockedFunction<
  typeof fetchNetworkStatus
>;
const mockFetchAccountBalance = fetchAccountBalance as jest.MockedFunction<
  typeof fetchAccountBalance
>;

describe("getAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return account with balance from rosetta", async () => {
    mockFetchNetworkStatus.mockResolvedValue({
      current_block_identifier: { index: 100, hash: "hash" },
    } as any);
    mockFetchAccountBalance.mockResolvedValue({
      balances: [
        {
          metadata: { total_balance: 5000000000, liquid_balance: 4000000000 },
        },
      ],
    } as any);

    const result = await getAccount("B62qtest");

    expect(result).toEqual({
      blockHeight: 100,
      balance: new BigNumber(5000000000),
      spendableBalance: new BigNumber(4000000000),
    });
  });

  it("should return zero balances when fetchAccountBalance fails", async () => {
    mockFetchNetworkStatus.mockResolvedValue({
      current_block_identifier: { index: 100, hash: "hash" },
    } as any);
    mockFetchAccountBalance.mockRejectedValue(new Error("not found"));

    const result = await getAccount("B62qtest");

    expect(result).toEqual({
      blockHeight: 100,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
    });
  });
});
