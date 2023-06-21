import BigNumber from "bignumber.js";
import { getAccount } from "./sidecar";

const networkApiMock = jest.fn();

describe("getAccount", () => {
  it("should estimate lockedBalance correctly with 1 locked balance type", async () => {
    const lockedBalanceFn = getAccount(networkApiMock, jest.fn());
    networkApiMock.mockResolvedValue({
      data: {
        locks: [
          {
            amount: "60000000000",
            reason: "All",
          },
        ],
        targets: [],
      },
    });
    const { lockedBalance } = await lockedBalanceFn("addr");
    expect(lockedBalance).toEqual(new BigNumber("60000000000"));
  });

  it("should estimate lockedBalance when one locked balance is higher than others", async () => {
    const lockedBalanceFn = getAccount(networkApiMock, jest.fn());
    networkApiMock.mockResolvedValue({
      data: {
        locks: [
          {
            amount: "1",
            reason: "reason 1",
          },
          {
            amount: "5",
            reason: "reason 2",
          },
          {
            amount: "3",
            reason: "reason 3",
          },
        ],
        targets: [],
      },
    });
    const { lockedBalance } = await lockedBalanceFn("addr");
    expect(lockedBalance).toEqual(new BigNumber("5"));
  });
});
