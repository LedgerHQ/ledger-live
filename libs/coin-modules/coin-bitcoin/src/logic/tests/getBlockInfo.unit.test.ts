import { fetchBlock } from "../../network/explorer";
import { getBlockInfo, toBlockInfo } from "../getBlockInfo";
import { makeBlock, testContext } from "./helpers/msw";

jest.mock("../../network/explorer");

const mockedBlock = jest.mocked(fetchBlock);

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("maps the block of the requested height", async () => {
    mockedBlock.mockImplementation(async (_config, _currency, height) =>
      makeBlock(height, { hash: "0c".repeat(32), time: "2009-04-06T03:23:33Z" }),
    );
    expect(await getBlockInfo(testContext(), "bitcoin", 10000)).toEqual({
      height: 10000,
      hash: "0c".repeat(32),
      time: new Date("2009-04-06T03:23:33Z"),
    });
    expect(mockedBlock).toHaveBeenCalledWith(expect.anything(), "bitcoin", 10000);
  });

  it("omits the parent when the payload has no previous hash", () => {
    expect(toBlockInfo(makeBlock(5, { prevHash: null }))).not.toHaveProperty("parent");
  });

  it("omits the parent of the genesis block", () => {
    expect(toBlockInfo(makeBlock(0, { prevHash: "00".repeat(32) }))).not.toHaveProperty("parent");
  });
});
