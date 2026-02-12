import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { createRegistryAndExtrinsics } from "../network/common";
import {
  fixtureChainSpec,
  fixtureTransactionParams,
  fixtureTxMaterialWithMetadata,
} from "../network/sidecar.fixture";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import getEstimatedFees from "./getFeesForTransaction";

const mockPaymentInfo = jest.fn();
const mockRegistry = jest
  .fn()
  .mockResolvedValue(createRegistryAndExtrinsics(fixtureTxMaterialWithMetadata, fixtureChainSpec));
const mockTransactionParams = jest.fn().mockResolvedValue(fixtureTransactionParams);
jest.mock("../network/sidecar", () => ({
  getRegistry: () => mockRegistry(),
  paymentInfo: (signedTx: string, currency: CryptoCurrency | undefined) =>
    mockPaymentInfo(signedTx, currency),
  getTransactionParams: () => mockTransactionParams(),
}));

jest.mock("../config");
const mockGetConfig = jest.mocked(coinConfig.getCoinConfig);

describe("getEstimatedFees", () => {
  const transaction = createFixtureTransaction();
  beforeAll(() => {
    mockGetConfig.mockImplementation((): any => {
      return {
        status: {
          type: "active",
        },
        sidecar: {
          url: "https://polkadot-sidecar.coin.ledger.com",
          credentials: "",
        },
        staking: {
          electionStatusThreshold: 25,
        },
        metadataShortener: {
          url: "https://polkadot-metadata-shortener.api.live.ledger.com/transaction/metadata",
          id: "dot",
        },
        metadataHash: {
          url: "https://polkadot-metadata-shortener.api.live.ledger.com/node/metadata/hash",
        },
      };
    });
  });

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
      account,
      transaction,
    });

    // Then
    expect(mockPaymentInfo).toHaveBeenCalledTimes(1);
    expect(mockPaymentInfo.mock.lastCall).not.toBeNull();

    const currency = getCryptoCurrencyById(account.currency.id);
    expect(mockPaymentInfo.mock.lastCall[1]).toEqual(currency);

    expect(result).toEqual(new BigNumber(partialFee));
  });
});
