import BigNumber from "bignumber.js";
import { loadPolkadotCrypto } from "./polkadot-crypto";
import getEstimatedFees from "./getFeesForTransaction";
import {
  fixtureChainSpec,
  fixtureTxMaterialWithMetadata,
  fixtureTransactionParams,
} from "../network/sidecar.fixture";
import { createFixtureAccount, createFixtureTransaction } from "../types/model.fixture";
import { createRegistryAndExtrinsics } from "../network/common";

jest.mock("./polkadot-crypto");

const mockPaymentInfo = jest.fn().mockResolvedValue({
  weight: "WHATEVER",
  class: "WHATEVER",
  partialFee: "155099814",
});
const mockRegistry = jest
  .fn()
  .mockResolvedValue(createRegistryAndExtrinsics(fixtureTxMaterialWithMetadata, fixtureChainSpec));
const mockTransactionParams = jest.fn().mockResolvedValue(fixtureTransactionParams);

jest.mock("../network/sidecar", () => ({
  getRegistry: () => mockRegistry(),
  paymentInfo: (args: any) => mockPaymentInfo(args),
  getTransactionParams: () => mockTransactionParams(),
}));

describe("getEstimatedFees", () => {
  const transaction = createFixtureTransaction();

  it("calls loadPolkadotCrypto (WASM check)", async () => {
    // Given
    const account = createFixtureAccount();
    const mockLoadPolkadotCrypto = jest.mocked(loadPolkadotCrypto);

    // When
    await getEstimatedFees({ a: account, t: transaction });

    // Then
    // Test to comply with existing code. Should be 1 time only.
    expect(mockLoadPolkadotCrypto).toHaveBeenCalledTimes(2);
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
