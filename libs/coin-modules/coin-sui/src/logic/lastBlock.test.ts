import { lastBlock } from "./lastBlock";
import { getLastBlock } from "../network/sdk";

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
    const result = await lastBlock();

    expect(result).toEqual({
      height: BigInt(mockSeq),
      hash: mockHash,
    });
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
