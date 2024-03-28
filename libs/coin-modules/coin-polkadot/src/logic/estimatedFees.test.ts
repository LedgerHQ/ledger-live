import BigNumber from "bignumber.js";
import { loadPolkadotCrypto } from "./polkadot-crypto";
<<<<<<< HEAD:libs/coin-modules/coin-polkadot/src/logic/getFeesForTransaction.test.ts
import { getEstimatedFees } from "./getFeesForTransaction";
import {
  fixtureChainSpec,
  fixtureTxMaterialWithMetadata,
  fixtureTransactionParams,
} from "../network/sidecar.fixture";
=======
import estimatedFees from "./estimatedFees";
import { fixtureChainSpec, fixtureTxMaterialWithMetadata } from "../network/sidecar.fixture";
>>>>>>> 0aed805bd6 (chore: separate more bridge dedicated logic from coin logic):libs/coin-modules/coin-polkadot/src/logic/estimatedFees.test.ts
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

describe("estimatedFees", () => {
  const transaction = createFixtureTransaction();

  beforeEach(() => {
    mockPaymentInfo.mockClear();
  });

  it("calls loadPolkadotCrypto (WASM check)", async () => {
    // Given
    const account = createFixtureAccount();
    const mockLoadPolkadotCrypto = jest.mocked(loadPolkadotCrypto);

    // When
    await estimatedFees({
      accountAddress: account.freshAddress,
      amount: BigInt(transaction.amount.toString()),
    });

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
    const result = await estimatedFees({
      accountAddress: account.freshAddress,
      amount: BigInt(transaction.amount.toString()),
    });

    // Then
    expect(mockPaymentInfo).toHaveBeenCalledTimes(1);
    // Receive hex signature computed by Polkadot lib
    expect(mockPaymentInfo.mock.lastCall).not.toBeNull();
    expect(result).toEqual(BigInt(partialFee));
  });
});
