import BigNumber from "bignumber.js";
import { getAccount } from "./sidecar";
import network from "@ledgerhq/live-network/network";

jest.mock("@ledgerhq/live-network/network");
const networkApiMock = jest.mocked(network);

describe("getAccount", () => {
  it("should estimate lockedBalance correctly with 1 locked balance type", async () => {
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
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    });
    const { lockedBalance } = await getAccount("addr");
    expect(lockedBalance).toEqual(new BigNumber("60000000000"));
  });

  it("should estimate lockedBalance when one locked balance is higher than others", async () => {
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
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    });
    const { lockedBalance } = await getAccount("addr");
    expect(lockedBalance).toEqual(new BigNumber("5"));
  });
});
