import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { broadcast } from "./broadcast";

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

  it.each(["polkadot", "assethub_polkadot", "westend", "assethub_westend"])(
    "should broadcast using %s when provided",
    async currencyId => {
      const signature = "some random signature";
      await broadcast(signature, currencyId);

      expect(submitExtrinsicMock).toHaveBeenCalledTimes(1);
      expect(submitExtrinsicMock.mock.lastCall[0]).toEqual(signature);

      const currency = getCryptoCurrencyById(currencyId);
      expect(submitExtrinsicMock.mock.lastCall[1]).toEqual(currency);
    },
  );

  it("should broadcast using only signature when no currency provided", async () => {
    const signature = "some random signature";
    await broadcast(signature);

    expect(submitExtrinsicMock).toHaveBeenCalledTimes(1);
    expect(submitExtrinsicMock.mock.lastCall[0]).toEqual(signature);
    expect(submitExtrinsicMock.mock.lastCall[1]).toEqual(undefined);
  });
});
