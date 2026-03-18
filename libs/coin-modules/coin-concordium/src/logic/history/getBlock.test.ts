import { getBlock } from "./getBlock";

jest.mock("../../network/grpcClient", () => ({
  getBlockByHeight: jest.fn(),
}));

const { getBlockByHeight: getBlockByHeightMock } = jest.requireMock("../../network/grpcClient");

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return block from grpc client by height", async () => {
    // GIVEN
    const mockBlock = {
      height: 1000,
      hash: "blockhash1000",
      time: new Date("2024-01-10"),
      transactions: [],
    };
    getBlockByHeightMock.mockResolvedValue(mockBlock);

    // WHEN
    const result = await getBlock(1000, "concordium_testnet");

    // THEN
    expect(getBlockByHeightMock).toHaveBeenCalledWith("concordium_testnet", 1000);
    expect(result).toEqual(mockBlock);
  });
});
