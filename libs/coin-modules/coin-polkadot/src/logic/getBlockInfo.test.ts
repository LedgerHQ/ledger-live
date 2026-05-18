import { getBlockInfo } from "./getBlockInfo";
import { fixtureBlockByHeight } from "../network/sidecar.fixture";

const mockGetBlockByHeight = jest.fn();

jest.mock("../network", () => {
  return {
    __esModule: true,
    default: {
      getBlockByHeight: (...args: unknown[]) => mockGetBlockByHeight(...args),
    },
  };
});

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("height validation", () => {
    it("rejects height 0", async () => {
      await expect(getBlockInfo(0)).rejects.toThrow(
        "getBlockInfo: height must be a positive integer, got 0",
      );
    });

    it("rejects negative height", async () => {
      await expect(getBlockInfo(-1)).rejects.toThrow(
        "getBlockInfo: height must be a positive integer, got -1",
      );
    });

    it("rejects non-integer height", async () => {
      await expect(getBlockInfo(1.5)).rejects.toThrow(
        "getBlockInfo: height must be a positive integer, got 1.5",
      );
    });

    it("rejects NaN", async () => {
      await expect(getBlockInfo(Number.NaN)).rejects.toThrow(
        "getBlockInfo: height must be a positive integer, got NaN",
      );
    });

    it("rejects Infinity", async () => {
      await expect(getBlockInfo(Number.POSITIVE_INFINITY)).rejects.toThrow(
        "getBlockInfo: height must be a positive integer, got Infinity",
      );
    });
  });

  describe("happy path", () => {
    it("returns correct BlockInfo with parent for height > 1", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        ...fixtureBlockByHeight,
        number: "100",
        hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
        parentHash: "0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
      });

      const result = await getBlockInfo(100);

      expect(mockGetBlockByHeight).toHaveBeenCalledTimes(1);
      expect(mockGetBlockByHeight).toHaveBeenCalledWith(100);
      expect(result.height).toBe(100);
      expect(result.hash).toBe(
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
      );
      expect(result.time).toBeInstanceOf(Date);
      expect(result.parent).toEqual({
        height: 99,
        hash: "0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
      });
    });

    it("returns BlockInfo without parent for genesis block (height === 1)", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        ...fixtureBlockByHeight,
        number: "1",
        hash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        parentHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      const result = await getBlockInfo(1);

      expect(result.height).toBe(1);
      expect(result.parent).toBeUndefined();
    });
  });
});
