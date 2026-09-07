import { mockEvmContext } from "../fixtures/context.fixtures";
import { createApi, parseCallParams } from "./index";
import { getValidatorsPage } from "../staking/validators";

jest.mock("../staking/validators", () => ({
  getValidatorsPage: jest.fn(),
}));

describe.each([
  [
    "with explorer",
    { explorer: { type: "ledger" } },
    {
      broadcast: expect.any(Function),
      call: expect.any(Function),
      combine: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getBalance: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      getNextSequence: expect.any(Function),
      getValidators: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
      validateAddress: expect.any(Function),
      validateIntent: expect.any(Function),
      craftTransactionData: expect.any(Function),
    },
  ],
  [
    "without explorer",
    { explorer: { type: "none" } },
    {
      broadcast: expect.any(Function),
      call: expect.any(Function),
      combine: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getBalance: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      getNextSequence: expect.any(Function),
      getValidators: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
      validateAddress: expect.any(Function),
      validateIntent: expect.any(Function),
      craftTransactionData: expect.any(Function),
    },
  ],
])("coin-framework methods %s", (_s, _config, methods) => {
  it("declares every method the chain supports", () => {
    expect(createApi("ethereum")).toEqual(methods);
  });

  it("omits the capabilities the chain has none of", () => {
    const impl = createApi("ethereum");
    for (const method of ["craftRawTransaction", "register", "getStakes", "getRewards"] as const) {
      expect(impl).not.toHaveProperty(method);
    }
  });
});

describe("parseCallParams", () => {
  it("accepts EVM call params", () => {
    expect(
      parseCallParams({
        to: "0x0000000000000000000000000000000000000001",
        data: "0x1234",
        block: "latest",
      }),
    ).toEqual({
      to: "0x0000000000000000000000000000000000000001",
      data: "0x1234",
      block: "latest",
    });
  });

  it("accepts empty calldata", () => {
    expect(
      parseCallParams({
        to: "0x0000000000000000000000000000000000000001",
        data: "0x",
      }),
    ).toEqual({
      to: "0x0000000000000000000000000000000000000001",
      data: "0x",
    });
  });

  it.each([
    // wrapped so Jest passes the empty array as the single `params` arg (covers the array-rejection path)
    [[]],
    { data: "0x1234" },
    { to: "0x0000000000000000000000000000000000000001" },
    {
      to: "0x0000000000000000000000000000000000000001",
      data: "0x1234",
      block: -1,
    },
    {
      to: "0x0000000000000000000000000000000000000001",
      data: "0x1234",
      block: "",
    },
    // "to" is not a 20-byte hex address
    { to: "0x1234", data: "0x1234" },
    { to: "not-an-address", data: "0x1234" },
    // "data" is not 0x-prefixed hex calldata
    { to: "0x0000000000000000000000000000000000000001", data: "1234" },
    { to: "0x0000000000000000000000000000000000000001", data: "0xzz" },
  ])("rejects invalid params %#", params => {
    expect(() => parseCallParams(params)).toThrow("Invalid EVM call params");
  });

  it("rejects invalid params as a rejected promise, not a synchronous throw", async () => {
    const api = createApi("ethereum");
    await expect(api.call(mockEvmContext, {})).rejects.toThrow("Invalid EVM call params");
  });
});

describe("staking support capability", () => {
  it("exposes validators through the api when staking validators are available", async () => {
    const mockGetValidatorsPage = jest.mocked(getValidatorsPage);
    const expectedPage = {
      items: [
        {
          id: "seivaloper1validator",
          address: "seivaloper1validator",
          name: "Validator One",
          balance: 1234n,
          commissionRate: "0.05",
          apy: 0.11,
        },
      ],
      next: undefined,
    };
    mockGetValidatorsPage.mockResolvedValue(expectedPage);

    const api = createApi("sei_evm");

    await expect(api.getValidators(mockEvmContext)).resolves.toEqual(expectedPage);
    expect(mockGetValidatorsPage).toHaveBeenCalledWith(expect.anything(), "sei_evm", undefined);

    await expect(api.getValidators(mockEvmContext, { cursor: "42" })).resolves.toEqual(
      expectedPage,
    );
    expect(mockGetValidatorsPage).toHaveBeenCalledWith(expect.anything(), "sei_evm", "42");
  });
});
