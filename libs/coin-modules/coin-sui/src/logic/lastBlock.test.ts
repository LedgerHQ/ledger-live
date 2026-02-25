import { getLastBlock } from "../network/sdk";
import { lastBlock } from "./lastBlock";

jest.mock("../network/sdk");

describe("lastBlock", () => {
  const mockHash = "0x1234567890abcdef";
  const mockSeq = "001";
  const mockTimestamp = "1747047353";
  const mock = jest.mocked(getLastBlock);
  beforeEach(() => {
    jest.clearAllMocks();
    mock.mockResolvedValue({
      digest: mockHash,
      sequenceNumber: mockSeq,
      timestampMs: mockTimestamp,
    });
  });

  it("should return block info with correct height and hash", async () => {
    const block = await lastBlock();

    expect(block).toEqual({
      hash: mockHash,
      height: Number(mockSeq),
      time: expect.any(Date),
    });
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
