import BigNumber from "bignumber.js";
import { createRegistryAndExtrinsics } from "../network/common";
import {
  fixtureChainSpec,
  fixtureTransactionParams,
  fixtureTxMaterialWithMetadata,
} from "../network/sidecar.fixture";
import { createMockPolkadotContext } from "../test/config.fixture";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import getEstimatedFees from "./getFeesForTransaction";

const mockPaymentInfo = jest.fn();
const mockRegistry = jest
  .fn()
  .mockResolvedValue(createRegistryAndExtrinsics(fixtureTxMaterialWithMetadata, fixtureChainSpec));
const mockTransactionParams = jest.fn().mockResolvedValue(fixtureTransactionParams);
jest.mock("../network/sidecar", () => ({
  getRegistry: () => mockRegistry(),
  paymentInfo: (_config: unknown, signedTx: string, currencyId: string | undefined) =>
    mockPaymentInfo(signedTx, currencyId),
  getTransactionParams: () => mockTransactionParams(),
}));

describe("getEstimatedFees", () => {
  const transaction = createFixtureTransaction();
  const context = createMockPolkadotContext();

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
    const result = await getEstimatedFees(context, {
      account,
      transaction,
    });

    // Then
    expect(mockPaymentInfo).toHaveBeenCalledTimes(1);
    expect(mockPaymentInfo.mock.lastCall).not.toBeNull();

    expect(mockPaymentInfo.mock.lastCall[1]).toEqual(account.currency.id);

    expect(result).toEqual(new BigNumber(partialFee));
  });
});
