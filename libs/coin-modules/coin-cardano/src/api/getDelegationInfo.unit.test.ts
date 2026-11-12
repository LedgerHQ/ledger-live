import network from "@ledgerhq/live-network/network";
import BigNumber from "bignumber.js";
import { cardanoCoinConfig as config } from "../fixtures/config";
import { getDelegationInfo } from "./getDelegationInfo";

jest.mock("@ledgerhq/live-network/network");
const mockNetwork = jest.mocked(network);

const withDelegation = (delegation: Record<string, unknown>) => ({ data: { delegation } }) as never;

describe("getDelegationInfo", () => {
  afterEach(() => jest.clearAllMocks());

  it("parses rewardsAvailable", async () => {
    mockNetwork.mockResolvedValue(
      withDelegation({ status: true, deposit: "2000000", rewardsAvailable: "1234" }),
    );

    expect((await getDelegationInfo(config, "stake"))?.rewards).toEqual(new BigNumber(1234));
  });

  it.each([undefined, null, "", "n/a"])(
    "defaults rewards to 0 when rewardsAvailable is %p",
    async rewardsAvailable => {
      mockNetwork.mockResolvedValue(
        withDelegation({ status: true, deposit: "2000000", rewardsAvailable }),
      );

      expect((await getDelegationInfo(config, "stake"))?.rewards).toEqual(new BigNumber(0));
    },
  );
});
