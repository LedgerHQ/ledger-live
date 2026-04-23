import { EvmConfig } from "../config";
import { createApi } from "./index";
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
      combine: expect.any(Function),
      craftRawTransaction: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getBalance: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      getRewards: expect.any(Function),
      getNextSequence: expect.any(Function),
      getStakes: expect.any(Function),
      getValidators: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
      validateAddress: expect.any(Function),
      validateIntent: expect.any(Function),
      validateTransaction: expect.any(Function),
      craftTransactionData: expect.any(Function),
    },
  ],
  [
    "without explorer",
    { explorer: { type: "none" } },
    {
      broadcast: expect.any(Function),
      combine: expect.any(Function),
      craftRawTransaction: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getBalance: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      getRewards: expect.any(Function),
      getNextSequence: expect.any(Function),
      getStakes: expect.any(Function),
      getValidators: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
      validateAddress: expect.any(Function),
      validateIntent: expect.any(Function),
      validateTransaction: expect.any(Function),
      refreshOperations: expect.any(Function),
      craftTransactionData: expect.any(Function),
    },
  ],
])("Alpaca methods %s", (_s, config, methods) => {
  it("ensures methods are presents", () => {
    expect(createApi(config as EvmConfig, "ethereum")).toEqual(methods);
  });
});

describe("staking support capability", () => {
  it("only exposes stakingSupported for currencies with staking configured", () => {
    expect(createApi({ explorer: { type: "ledger" } } as EvmConfig, "ethereum")).not.toHaveProperty(
      "stakingSupported",
    );
    expect(createApi({ explorer: { type: "ledger" } } as EvmConfig, "sei_evm")).toMatchObject({
      stakingSupported: true,
    });
  });

  it("exposes validators through the api when staking validators are available", async () => {
    const mockGetValidatorsPage = jest.mocked(getValidatorsPage);
    const expectedPage = {
      items: [
        {
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

    const api = createApi({ explorer: { type: "ledger" } } as EvmConfig, "sei_evm");

    await expect(api.getValidators()).resolves.toEqual(expectedPage);
  });
});
