import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { hydrate } from "./preload";
import { setHederaPreloadData } from "./preload-data";

jest.mock("./preload-data", () => ({
  setHederaPreloadData: jest.fn(),
}));

describe("hydrate", () => {
  const currency = getCryptoCurrencyById("hedera");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([undefined, null, {}, []])(
    "should hydrate empty validators list if data is corrupted (%p value)",
    value => {
      hydrate(value, currency);
      expect(setHederaPreloadData).toHaveBeenCalledWith({ validators: [] }, currency);
    },
  );

  it("should hydrate valid validators list", () => {
    hydrate(
      {
        validators: [
          {
            nodeId: 1,
            address: "0.0.1",
            addressChecksum: "abcde",
            name: "Ledger",
            minStake: "1",
            maxStake: "10",
            activeStake: "5",
            activeStakePercentage: "50",
            overstaked: false,
          },
        ],
      },
      currency,
    );

    expect(setHederaPreloadData).toHaveBeenCalledWith(
      {
        validators: [
          {
            nodeId: 1,
            address: "0.0.1",
            addressChecksum: "abcde",
            name: "Ledger",
            minStake: new BigNumber(1),
            maxStake: new BigNumber(10),
            activeStake: new BigNumber(5),
            activeStakePercentage: new BigNumber(50),
            overstaked: false,
          },
        ],
      },
      currency,
    );
  });
});
