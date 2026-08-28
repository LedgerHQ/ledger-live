import { Aptos } from "@aptos-labs/ts-sdk";
import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import { createApi } from "../../api";
import { createMockAptosContext } from "../../test/context";

jest.mock("@aptos-labs/ts-sdk");
let mockedAptos: jest.Mocked<any>;

describe("createApi", () => {
  it("declares every method the chain supports", () => {
    const api = createApi();

    // Check that methods are set with what we expect
    expect(api).toEqual({
      broadcast: expect.any(Function),
      combine: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getBalance: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
      validateAddress: expect.any(Function),
      craftTransactionData: expect.any(Function),
    });
  });

  it("omits the capabilities the chain has none of", () => {
    const api = createApi();

    for (const method of [
      "call",
      "register",
      "craftRawTransaction",
      "getBlock",
      "getBlockInfo",
      "getStakes",
      "getRewards",
      "getValidators",
      "validateIntent",
      "getNextSequence",
    ] as const) {
      expect(api).not.toHaveProperty(method);
    }
  });

  it("raises 'not supported' for those capabilities once withDefaults is applied", () => {
    // The consumer path: the resolver wraps the module, and the wrapper is what answers for a
    // capability the module does not carry.
    const api = withDefaults(createApi());
    const context = createMockAptosContext();

    expect(() => api.getBlock(context, 1)).toThrow("getBlock is not supported");
    expect(() => api.getStakes(context, "address")).toThrow("getStakes is not supported");
    expect(() => api.getNextSequence(context, "address")).toThrow(
      "getNextSequence is not supported",
    );
    expect(api.supports("validateAddress")).toBe(true);
    expect(api.supports("validateIntent")).toBe(false);
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

    const api = createApi();
    const context = createMockAptosContext();

    expect(await api.lastBlock(context)).toStrictEqual({
      height: 123,
      hash: "123hash",
      time: new Date(1746021098623892 / 1_000),
    });
  });
});
