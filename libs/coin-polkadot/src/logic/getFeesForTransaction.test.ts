import BigNumber from "bignumber.js";
import { HttpResponse, http } from "msw";
import { loadPolkadotCrypto } from "./polkadot-crypto";
import getEstimatedFees from "./getFeesForTransaction";
import mockServer from "../network/sidecar.mock";
import { createFixtureAccount, createFixtureTransaction } from "../types/model.fixture";

jest.mock("./polkadot-crypto");

describe("getEstimatedFees", () => {
  const transaction = createFixtureTransaction();

  beforeAll(() => {
    mockServer.listen();
  });

  beforeEach(() => {
    mockServer.resetHandlers();
  });

  afterAll(() => {
    mockServer.close();
  });

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
    const partialFee = "155099814";
    mockServer.use(
      http.post("https://polkadot-sidecar.coin.ledger.com/transaction/fee-estimate", () => {
        return HttpResponse.json({
          weight: "WHATEVER",
          class: "WHATEVER",
          partialFee,
        });
      }),
    );

    // When
    const result = await getEstimatedFees({
      a: account,
      t: transaction,
    });

    // Then
    expect(result).toEqual(new BigNumber(partialFee));
  });
});
