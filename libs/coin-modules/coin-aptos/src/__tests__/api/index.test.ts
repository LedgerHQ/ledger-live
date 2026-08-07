import { Aptos } from "@aptos-labs/ts-sdk";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import { createApi } from "../../api";
import type { AptosCoinConfig } from "../../config";
import { createMockAptosContext } from "../../test/context";

jest.mock("@aptos-labs/ts-sdk");
let mockedAptos: jest.Mocked<any>;

describe("createApi", () => {
  it("should return an API object with coin module api methods", () => {
    const api: CoinModuleApi<AptosCoinConfig> = createApi();

    // Check that methods are set with what we expect
    expect(api).toEqual({
      broadcast: expect.any(Function),
      call: expect.any(Function),
      combine: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getBalance: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
      craftRawTransaction: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      getNextSequence: expect.any(Function),
      getRewards: expect.any(Function),
      getStakes: expect.any(Function),
      getValidators: expect.any(Function),
      validateAddress: expect.any(Function),
      validateIntent: expect.any(Function),
      craftTransactionData: expect.any(Function),
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

    const api: CoinModuleApi<AptosCoinConfig> = createApi();
    const context = createMockAptosContext();

    expect(await api.lastBlock(context)).toStrictEqual({
      height: 123,
      hash: "123hash",
      time: new Date(1746021098623892 / 1_000),
    });
  });
});
