import BigNumber from "bignumber.js";
import { getAccount } from "./sidecar";

const networkApiMock = jest.fn();

describe("getAccount", () => {
  it("should estimate lockedBalance correctly with 1 locked balance type", async () => {
    const lockedBalanceFn = getAccount(networkApiMock, jest.fn());
    networkApiMock.mockResolvedValue({
      data: {
        at: {
          height: "0",
        },
        locks: [
          {
            amount: "60000000000",
            reasons: "All",
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
        at: {
          height: "0",
        },
        locks: [
          {
            amount: "1",
            reasons: "reason 1",
          },
          {
            amount: "5",
            reasons: "reason 2",
          },
          {
            amount: "3",
            reasons: "reason 3",
          },
        ],
        targets: [],
      },
    });
    const { lockedBalance } = await lockedBalanceFn("addr");
    expect(lockedBalance).toEqual(new BigNumber("5"));
  });
});
