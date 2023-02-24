import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { estimateGasLimit } from "./gas";
import * as ethereumApi from "../../api/Ethereum";

const api = {
  getDryRunGasLimit: jest.fn(),
  getFallbackGasLimit: jest.fn(),
};

const MULTIPLIER = 2.2;

import type { API } from "../../api/Ethereum";
import { setEnv } from "../../env";

describe("estimateGasLimit", () => {
  const accountMock = {
    currency: {
      explorerId: "eth",
    },
  } as Account;

  const transactionMock = {
    from: "",
    to: "",
    value: "",
    data: "",
  };

  beforeEach(() => {
    jest
      .spyOn(ethereumApi, "apiForCurrency")
      .mockImplementation(() => api as unknown as API);
  });

  afterEach(() => {
    // @ts-expect-error not exposed in typings
    estimateGasLimit.reset();
  });

  describe("When dryrun call works correctly", () => {
    it("should return value if value equals 21k", async () => {
      const twentyOneK = new BigNumber(21000);
      api.getDryRunGasLimit.mockReturnValueOnce(Promise.resolve(twentyOneK));
      const gas = await estimateGasLimit(accountMock, transactionMock);
      expect(gas).toEqual(twentyOneK);
      expect(api.getFallbackGasLimit).not.toHaveBeenCalledTimes(1);
    });

    it("should return value multiplied by amplifier if value isn't 21k", async () => {
      setEnv("ETHEREUM_GAS_LIMIT_AMPLIFIER", MULTIPLIER);
      const definitelyNotTwentyOneK = new BigNumber(100);
      api.getDryRunGasLimit.mockReturnValueOnce(
        Promise.resolve(definitelyNotTwentyOneK)
      );
      const gas = await estimateGasLimit(accountMock, transactionMock);
      expect(gas).toEqual(
        definitelyNotTwentyOneK.times(MULTIPLIER).integerValue()
      );
      expect(api.getFallbackGasLimit).not.toHaveBeenCalledTimes(1);
    });
  });

  describe("When dryrun is failing", () => {
    it("should return fallback gas service value", async () => {
      const fallbackValue = new BigNumber(777);
      api.getDryRunGasLimit.mockRejectedValueOnce(new Error("ups"));
      api.getFallbackGasLimit.mockReturnValueOnce(
        Promise.resolve(fallbackValue)
      );
      const gas = await estimateGasLimit(accountMock, transactionMock);
      expect(gas).toEqual(fallbackValue);
      expect(api.getFallbackGasLimit).toHaveBeenCalledTimes(1);
    });
  });
});
