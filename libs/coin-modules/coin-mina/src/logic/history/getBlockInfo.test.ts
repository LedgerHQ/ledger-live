jest.mock("../../api");

import { rosettaGetBlockInfo } from "../../api";
import { getBlockInfo } from "./getBlockInfo";

const mockRosettaGetBlockInfo = rosettaGetBlockInfo as jest.MockedFunction<
  typeof rosettaGetBlockInfo
>;

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return block info from rosetta", async () => {
    const mockData = {
      block: {
        block_identifier: { index: 50, hash: "bh" },
        parent_block_identifier: { index: 49, hash: "pbh" },
        timestamp: 12345,
      },
    };
    mockRosettaGetBlockInfo.mockResolvedValue(mockData);

    const result = await getBlockInfo(50);

    expect(result).toEqual(mockData);
    expect(mockRosettaGetBlockInfo).toHaveBeenCalledWith(50);
  });
});
