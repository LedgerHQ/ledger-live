import BigNumber from "bignumber.js";
import { CosmosAccount, Transaction } from "./types";
import { getEstimatedFees } from "./js-prepareTransaction";
import network from "../../network";
jest.mock("../../network");

const account = {
  id: "accountId",
  currency: { id: "cosmos", units: [{}, { code: "atom" }] },
  spendableBalance: new BigNumber("1000000000"),
  seedIdentifier: "seedIdentifier",
} as CosmosAccount;
const transaction = {
  mode: "send",
  recipient: "cosmosrecipientaddress",
  amount: new BigNumber("1000000"),
  memo: "test memo",
  useAllAmount: false,
} as unknown as Transaction;

describe("getEstimatedFees", () => {
  it("should return gas higher than estimate", async () => {
    const gasSimulationMock = 42000;
    // @ts-expect-error method is mocked
    network.mockResolvedValue({
      data: {
        gas_info: {
          gas_used: gasSimulationMock,
        },
      },
    });
    const { estimatedGas } = await getEstimatedFees(account, transaction);
    expect(estimatedGas.gt(new BigNumber(gasSimulationMock))).toEqual(true);
  });

  it("should calculate fees for a transaction", async () => {
    // @ts-expect-error method is mocked
    network.mockResolvedValue({
      data: {
        gas_info: {
          gas_used: 42000,
        },
      },
    });
    const { estimatedFees, estimatedGas } = await getEstimatedFees(
      account,
      transaction
    );
    expect(estimatedFees.gt(0)).toEqual(true);
    expect(estimatedGas.gt(0)).toEqual(true);
  });
});
