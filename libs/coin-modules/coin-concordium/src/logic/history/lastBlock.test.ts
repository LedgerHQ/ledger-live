import { lastBlock } from "./lastBlock";
import { createFixtureConfig } from "../../test/fixtures";

jest.mock("../../network/proxyClient", () => ({
  getConsensusInfo: jest.fn(),
}));

const { getConsensusInfo: getConsensusInfoMock } = jest.requireMock("../../network/proxyClient");

const config = createFixtureConfig();

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return block info from proxy client consensusInfo", async () => {
    // GIVEN
    const mockTimestamp = "2024-01-15T10:30:00.000Z";
    getConsensusInfoMock.mockResolvedValue({
      lastFinalizedBlockHeight: 12345,
      lastFinalizedBlock: "abc123hash",
      lastFinalizedTime: mockTimestamp,
    });

    // WHEN
    const result = await lastBlock(config, "concordium_testnet");

    // THEN
    expect(getConsensusInfoMock).toHaveBeenCalledWith(config, "concordium_testnet");
    expect(result).toEqual({
      height: 12345,
      hash: "abc123hash",
      time: new Date(mockTimestamp),
    });
  });
});
