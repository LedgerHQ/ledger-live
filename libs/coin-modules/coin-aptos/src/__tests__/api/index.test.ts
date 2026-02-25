import { Aptos } from "@aptos-labs/ts-sdk";
import type { AlpacaApi } from "@ledgerhq/coin-framework/api/types";
import { createApi } from "../../api";
import type { AptosConfig } from "../../config";
import coinConfig from "../../config";

jest.mock("@aptos-labs/ts-sdk");
let mockedAptos: jest.Mocked<any>;

jest.mock("../../config", () => ({
  setCoinConfig: jest.fn(),
}));

const mockAptosConfig: AptosConfig = {} as AptosConfig;

describe("createApi", () => {
  it("should set the coin config value", () => {
    const setCoinConfigSpy = jest.spyOn(coinConfig, "setCoinConfig");

    createApi(mockAptosConfig);

    const config = setCoinConfigSpy.mock.calls[0][0]();

    expect(setCoinConfigSpy).toHaveBeenCalled();

    expect(config).toEqual(
      expect.objectContaining({
        ...mockAptosConfig,
        status: { type: "active" },
      }),
    );
  });

  it("should return an API object with alpaca api methods", () => {
    const api: AlpacaApi = createApi(mockAptosConfig);

    // Check that methods are set with what we expect
    expect(api).toEqual({
      broadcast: expect.any(Function),
      combine: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getBalance: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
      craftRawTransaction: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      getRewards: expect.any(Function),
      getStakes: expect.any(Function),
      getValidators: expect.any(Function),
    });
  });
});

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

    const api: AlpacaApi = createApi(mockAptosConfig);

    expect(await api.lastBlock()).toStrictEqual({
      height: 123,
      hash: "123hash",
      time: new Date(1746021098623892 / 1_000),
    });
  });
});
