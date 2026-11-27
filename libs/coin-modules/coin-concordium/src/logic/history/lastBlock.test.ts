import { lastBlock } from "./lastBlock";
import { createFixtureContext } from "../../test/fixtures";

jest.mock("../../network/proxyClient", () => ({
  getConsensusInfo: jest.fn(),
}));

const { getConsensusInfo: getConsensusInfoMock } = jest.requireMock("../../network/proxyClient");

const context = createFixtureContext();

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
    const result = await lastBlock(context);

    // THEN
    expect(getConsensusInfoMock).toHaveBeenCalledWith(context);
    expect(result).toEqual({
      height: 12345,
      hash: "abc123hash",
      time: new Date(mockTimestamp),
    });
  });
});
