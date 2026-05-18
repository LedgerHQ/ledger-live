import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { broadcast } from "./broadcast";

const submitExtrinsicMock = jest.fn();
const submitExtrinsicDryRunMock = jest.fn();

jest.mock("../network", () => ({
  submitExtrinsic: (extrinsic: string, currency?: CryptoCurrency) =>
    submitExtrinsicMock(extrinsic, currency),
  submitExtrinsicDryRun: (extrinsic: string, currency?: CryptoCurrency) =>
    submitExtrinsicDryRunMock(extrinsic, currency),
}));

describe("broadcast", () => {
  beforeEach(() => {
    submitExtrinsicMock.mockClear();
    submitExtrinsicDryRunMock.mockClear();
  });

  it.each(["polkadot", "assethub_polkadot", "westend", "assethub_westend"])(
    "should broadcast using %s when provided",
    async currencyId => {
      const signedExtrinsic = "some signed extrinsic";
      await broadcast(signedExtrinsic, currencyId);

      const currency = getCryptoCurrencyById(currencyId);

      expect(submitExtrinsicDryRunMock).toHaveBeenCalledTimes(1);
      expect(submitExtrinsicDryRunMock.mock.lastCall).toEqual([signedExtrinsic, currency]);

      expect(submitExtrinsicMock).toHaveBeenCalledTimes(1);
      expect(submitExtrinsicMock.mock.lastCall).toEqual([signedExtrinsic, currency]);
    },
  );

  it("defaults to polkadot currency when no currencyId is provided", async () => {
    const signedExtrinsic = "some signed extrinsic";
    await broadcast(signedExtrinsic);

    const polkadot = getCryptoCurrencyById("polkadot");

    expect(submitExtrinsicDryRunMock).toHaveBeenCalledTimes(1);
    expect(submitExtrinsicDryRunMock.mock.lastCall).toEqual([signedExtrinsic, polkadot]);

    expect(submitExtrinsicMock).toHaveBeenCalledTimes(1);
    expect(submitExtrinsicMock.mock.lastCall).toEqual([signedExtrinsic, polkadot]);
  });
});
