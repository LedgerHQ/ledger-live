import BigNumber from "bignumber.js";
import getEstimatedFees from "./getFeesForTransaction";
import { fixtureChainSpec, fixtureTxMaterialWithMetadata } from "../network/sidecar.fixture";
import { createFixtureAccount, createFixtureTransaction } from "../types/model.fixture";

const mockPaymentInfo = jest.fn();
jest.mock("../network/sidecar", () => ({
  ...jest.requireActual("../network/sidecar"),
  fetchChainSpec: () => jest.fn().mockResolvedValue(fixtureChainSpec),
  getTransactionMaterialWithMetadata: () =>
    jest.fn().mockResolvedValue(fixtureTxMaterialWithMetadata),
  paymentInfo: (args: any) => mockPaymentInfo(args),
}));
mockPaymentInfo.mockResolvedValue({
  weight: "WHATEVER",
  class: "WHATEVER",
  partialFee: "155099814",
});

describe("getEstimatedFees", () => {
  const transaction = createFixtureTransaction();

  beforeEach(() => {
    mockPaymentInfo.mockClear();
  });

  it("returns estimation from Polkadot explorer", async () => {
    // Given
    const account = createFixtureAccount();
    const partialFee = "155099812";
    mockPaymentInfo.mockResolvedValue({
      weight: "WHATEVER",
      class: "WHATEVER",
      partialFee,
    });

    // When
    const result = await getEstimatedFees({
      a: account,
      t: transaction,
    });

    // Then
    expect(mockPaymentInfo).toHaveBeenCalledTimes(1);
    // Receive hex signature computed by Polkadot lib
    expect(mockPaymentInfo.mock.lastCall).not.toBeNull();
    expect(result).toEqual(new BigNumber(partialFee));
  });
});
