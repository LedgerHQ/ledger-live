import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { broadcast } from "./broadcast";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const submitExtrinsicMock = jest.fn();
jest.mock("../network", () => {
  return {
    submitExtrinsic: (extrinsic: string, currency?: CryptoCurrency) =>
      submitExtrinsicMock(extrinsic, currency),
  };
});

describe("broadcast", () => {
  beforeEach(() => {
    submitExtrinsicMock.mockClear();
  });

  it("should broadcast using currency when provided", async () => {
    const signature = "some random signature";
    await broadcast(signature, "polkadot");

    expect(submitExtrinsicMock).toHaveBeenCalledTimes(1);
    expect(submitExtrinsicMock.mock.lastCall[0]).toEqual(signature);

    const currency = getCryptoCurrencyById("polkadot");
    expect(submitExtrinsicMock.mock.lastCall[1]).toEqual(currency);
  });

  it("should broadcast using only signature when no currency provided", async () => {
    const signature = "some random signature";
    await broadcast(signature);

    expect(submitExtrinsicMock).toHaveBeenCalledTimes(1);
    expect(submitExtrinsicMock.mock.lastCall[0]).toEqual(signature);
    expect(submitExtrinsicMock.mock.lastCall[1]).toEqual(undefined);
  });
});
