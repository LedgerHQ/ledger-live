import { getAccountBannerState } from "./logic.ts";
import preloadedData = require("./preloadedData");
import bridge = require("../../bridge");

const ledgerValidator = {
  validatorAddress: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
  name: "Ledger",
  commission: 0.075,
};

const expensiveValidator = {
  validatorAddress: "cosmosvaloper1qs8tnw2t8l6amtzvdemnnsq9dzk0ag0z52uzay",
  name: "Castlenode",
  commission: 0.09,
};

const cheapValidator = {
  validatorAddress: "cosmosvaloper1q6d3d089hg59x6gcx92uumx70s5y5wadklue8s",
  name: "UbikCapital(0%Commission)",
  commission: 0,
};

const account = {
  cosmosResources: {
    delegations: [
      {
        validatorAddress:
          "cosmosvaloper1c4k24jzduc365kywrsvf5ujz4ya6mwympnc4en",
      },
    ],
    redelegations: [],
  },
};

const validators = [expensiveValidator, cheapValidator, ledgerValidator];

describe("cosmos/logic", () => {
  describe("useCosmosFormattedDelegations", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it("should not display the banner", async () => {
      jest
        .spyOn(preloadedData, "getCurrentCosmosPreloadData")
        .mockReturnValue({ validators });
      jest.spyOn(bridge, "getAccountBridge").mockReturnValue({
        estimateMaxSpendable: () => Promise.resolve(0),
      });
      const result = await getAccountBannerState(account);
      expect(result).toStrictEqual({
        display: false,
        redelegate: false,
        validatorSrcAddress: "",
        ledgerValidator,
      });
    });
    it("should return display delegate mode", async () => {
      jest
        .spyOn(preloadedData, "getCurrentCosmosPreloadData")
        .mockReturnValue({ validators });
      jest.spyOn(bridge, "getAccountBridge").mockReturnValue({
        estimateMaxSpendable: () => Promise.resolve(5000),
      });
      const result = await getAccountBannerState(account);
      expect(result).toStrictEqual({
        display: true,
        redelegate: false,
        validatorSrcAddress: "",
        ledgerValidator,
      });
    });
    it("should return display redelegate mode", async () => {
      jest
        .spyOn(preloadedData, "getCurrentCosmosPreloadData")
        .mockReturnValue({ validators });
      jest.spyOn(bridge, "getAccountBridge").mockReturnValue({
        estimateMaxSpendable: () => Promise.resolve(5000),
      });
      account.cosmosResources.redelegations.push({
        validatorDstAddress: expensiveValidator.validatorAddress,
      });
      const result = await getAccountBannerState(account);
      expect(result).toStrictEqual({
        display: true,
        redelegate: true,
        validatorSrcAddress: expensiveValidator.validatorAddress,
        ledgerValidator,
      });
    });
  });
});
