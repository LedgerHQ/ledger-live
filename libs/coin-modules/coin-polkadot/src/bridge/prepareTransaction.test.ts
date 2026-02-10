import { faker } from "@faker-js/faker";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import prepareTransaction from "./prepareTransaction";

const mockCraftTransaction = jest.fn();
const mockEstimateFees = jest.fn();
jest.mock("../logic", () => ({
  estimateFees: () => mockEstimateFees(),
  craftTransaction: () => mockCraftTransaction(),
}));

jest.mock("../config");
const mockGetConfig = jest.mocked(coinConfig.getCoinConfig);

describe("prepareTransaction", () => {
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
        },
        metadataHash: {
          url: "https://polkadot-metadata-shortener.api.live.ledger.com/node/metadata/hash",
        },
      };
    });
  });

  afterEach(() => {
    mockCraftTransaction.mockClear();
    mockEstimateFees.mockClear();
  });

  it("returns a new Transaction with new fees", async () => {
    // Given
    const fees = new BigNumber(faker.number.int(50));
    mockEstimateFees.mockResolvedValue(fees);
    const tx = createFixtureTransaction();

    // When
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // Then
    expect(mockCraftTransaction).toHaveBeenCalledTimes(1); // Check that Tx is concerted to core Tx.
    expect(mockEstimateFees).toHaveBeenCalledTimes(1);
    expect(newTx.fees).toEqual(fees);
    expect(newTx).not.toBe(tx);
    expect(newTx).toMatchObject({
      amount: tx.amount,
      recipient: tx.recipient,
      mode: tx.mode,
    });
  });

  it("returns the passed transaction if fees are the same", async () => {
    // Given
    const fees = new BigNumber(faker.number.int(50));
    mockEstimateFees.mockResolvedValue(fees);
    const tx = createFixtureTransaction({ fees });

    // When
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // Then
    expect(newTx).toBe(tx);
  });
});
