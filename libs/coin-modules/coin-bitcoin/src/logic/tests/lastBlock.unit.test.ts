import { fetchCurrentBlock } from "../../network/explorer";
import { lastBlock } from "../lastBlock";
import { makeBlock, testContext } from "./helpers/msw";

jest.mock("../../network/explorer");

const mockedCurrent = jest.mocked(fetchCurrentBlock);

describe("lastBlock", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("maps the tip, converting the ISO time to a Date", async () => {
    mockedCurrent.mockImplementation(async () =>
      makeBlock(969589, { hash: "0a".repeat(32), time: "2026-10-02T12:28:56Z" }),
    );
    expect(await lastBlock(testContext(), "bitcoin")).toEqual({
      height: 969589,
      hash: "0a".repeat(32),
      time: new Date("2026-10-02T12:28:56Z"),
    });
    expect(mockedCurrent).toHaveBeenCalledWith(expect.anything(), "bitcoin");
  });

  it("fills the parent when the previous hash is known", async () => {
    mockedCurrent.mockImplementation(async () => makeBlock(171, { prevHash: "0b".repeat(32) }));
    const info = await lastBlock(testContext(), "bitcoin");
    expect(info.parent).toEqual({ height: 170, hash: "0b".repeat(32) });
  });
});
