import { lastBlock } from "../../logic/lastBlock";
import { Aptos } from "@aptos-labs/ts-sdk";

jest.mock("@aptos-labs/ts-sdk");
let mockedAptos: jest.Mocked<any>;

describe("lastBlock", () => {
  beforeEach(() => {
    mockedAptos = jest.mocked(Aptos);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("returns the last block information", async () => {
    mockedAptos.mockImplementation(() => ({
      getLedgerInfo: jest.fn().mockReturnValue({
        block_height: "123",
      }),
      getBlockByHeight: jest.fn().mockReturnValue({
        block_height: "123",
        block_hash: "123hash",
        block_timestamp: "1746021098623892",
        first_version: "1",
        last_version: "1",
      }),
    }));

    expect(await lastBlock()).toStrictEqual({
      height: 123,
      hash: "123hash",
      time: new Date(1746021098623892),
    });
  });
});
