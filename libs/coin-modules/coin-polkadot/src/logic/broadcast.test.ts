import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { type PolkadotCoinConfig } from "../config";
import { broadcast } from "./broadcast";

const submitExtrinsicMock = jest.fn();
const submitExtrinsicDryRunMock = jest.fn();

jest.mock("../network", () => ({
  submitExtrinsic: (...args: unknown[]) => submitExtrinsicMock(...args),
  submitExtrinsicDryRun: (...args: unknown[]) => submitExtrinsicDryRunMock(...args),
}));

const config = {} as PolkadotCoinConfig;

describe("broadcast", () => {
  beforeEach(() => {
    submitExtrinsicMock.mockClear();
    submitExtrinsicDryRunMock.mockClear();
  });

  it.each(["polkadot", "assethub_polkadot", "westend", "assethub_westend"])(
    "should broadcast using %s when provided",
    async currencyId => {
      const signedExtrinsic = "some signed extrinsic";
      await broadcast(config, signedExtrinsic, currencyId);

      const currency = getCryptoCurrencyById(currencyId);

      expect(submitExtrinsicDryRunMock).toHaveBeenCalledTimes(1);
      expect(submitExtrinsicDryRunMock.mock.lastCall).toEqual([config, signedExtrinsic, currency]);

      expect(submitExtrinsicMock).toHaveBeenCalledTimes(1);
      expect(submitExtrinsicMock.mock.lastCall).toEqual([config, signedExtrinsic, currency]);
    },
  );

  it("defaults to polkadot currency when no currencyId is provided", async () => {
    const signedExtrinsic = "some signed extrinsic";
    await broadcast(config, signedExtrinsic);

    const polkadot = getCryptoCurrencyById("polkadot");

    expect(submitExtrinsicDryRunMock).toHaveBeenCalledTimes(1);
    expect(submitExtrinsicDryRunMock.mock.lastCall).toEqual([config, signedExtrinsic, polkadot]);

    expect(submitExtrinsicMock).toHaveBeenCalledTimes(1);
    expect(submitExtrinsicMock.mock.lastCall).toEqual([config, signedExtrinsic, polkadot]);
  });
});
