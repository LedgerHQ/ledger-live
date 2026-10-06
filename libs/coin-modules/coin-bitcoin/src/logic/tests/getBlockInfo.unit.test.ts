import * as coinNetwork from "../../network";
import { getBlockInfo } from "../getBlockInfo";
import type { BitcoinContext } from "../../api/config";

jest.mock("../../network");

const mockedGetBlockByHeight = coinNetwork.getBlockByHeight as jest.MockedFunction<
  typeof coinNetwork.getBlockByHeight
>;

const context = {
  config: async () => ({ status: { type: "active" } }),
} as unknown as BitcoinContext;

beforeEach(() => {
  jest.resetAllMocks();
});

describe("logic/getBlockInfo", () => {
  it("returns block metadata with a Date time", async () => {
    mockedGetBlockByHeight.mockResolvedValue({
      height: 800_000,
      hash: "0000abc",
      time: "2023-07-24T03:17:09Z",
    });

    const info = await getBlockInfo(context, "bitcoin", 800_000);

    expect(info.height).toBe(800_000);
    expect(info.hash).toBe("0000abc");
    expect(info.time).toBeInstanceOf(Date);
    expect(info.time.toISOString()).toBe("2023-07-24T03:17:09.000Z");
  });

  it("throws when the explorer has no block at that height", async () => {
    mockedGetBlockByHeight.mockResolvedValue(null);
    await expect(getBlockInfo(context, "bitcoin", 999_999_999)).rejects.toThrow(
      /no block at height/,
    );
  });
});
