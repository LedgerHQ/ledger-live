import { loadPolkadotCrypto } from "./polkadot-crypto";
import { estimateFees } from "./estimateFees";
import {
  fixtureChainSpec,
  fixtureTxMaterialWithMetadata,
  fixtureTransactionParams,
} from "../network/sidecar.fixture";
import { createRegistryAndExtrinsics } from "../network/common";
import { createFixtureAccount } from "../types/bridge.fixture";
import { craftEstimationTransaction } from "./craftTransaction";
import coinConfig from "../config";

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
  beforeEach(() => {
    mockPaymentInfo.mockClear();
  });
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: "https://polkadot-rpc.publicnode.com",
      },
      sidecar: {
        url: "https://polkadot-sidecar.coin.ledger.com",
      },
      staking: {
        electionStatusThreshold: 25,
      },
      metadataShortener: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/transaction/metadata",
      },
      metadataHash: {
        url: "https://polkadot-metadata-shortener.api.live.ledger.com/node/metadata/hash",
      },
    }));
  });

  it("calls loadPolkadotCrypto (WASM check)", async () => {
    // Given
    const account = createFixtureAccount();
    const mockLoadPolkadotCrypto = jest.mocked(loadPolkadotCrypto);
    const tx = await craftEstimationTransaction(account.freshAddress, BigInt(1000));

    // When
    await estimateFees(tx);

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
    const tx = await craftEstimationTransaction(account.freshAddress, BigInt(10000));

    // When
    const result = await estimateFees(tx);

    // Then
    expect(mockPaymentInfo).toHaveBeenCalledTimes(1);
    // Receive hex signature computed by Polkadot lib
    expect(mockPaymentInfo.mock.lastCall).not.toBeNull();
    expect(result).toEqual(BigInt(partialFee));
  });
});
