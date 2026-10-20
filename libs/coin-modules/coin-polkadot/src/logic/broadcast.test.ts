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

      expect(submitExtrinsicDryRunMock).toHaveBeenCalledTimes(1);
      expect(submitExtrinsicDryRunMock.mock.lastCall).toEqual([
        config,
        signedExtrinsic,
        currencyId,
      ]);

      expect(submitExtrinsicMock).toHaveBeenCalledTimes(1);
      expect(submitExtrinsicMock.mock.lastCall).toEqual([config, signedExtrinsic, currencyId]);
    },
  );
});
