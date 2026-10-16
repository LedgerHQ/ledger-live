import { BigNumber } from "bignumber.js";
import { getBitcoinCustomFeesPatch, getCustomFeesPerFamily } from "./utils";

const utxoStrategy = { strategy: 1, excludeUTXOs: [{ hash: "h", outputIndex: 0 }] };

describe("getBitcoinCustomFeesPatch", () => {
  it("puts the live app's rate and coin selection in familySpecificData, keeping the other choices", () => {
    expect(
      getBitcoinCustomFeesPatch(
        { familySpecificData: { opReturnData: "6869", feePerByte: "3" } },
        { feePerByte: "12.0", utxoStrategy },
      ),
    ).toEqual({ familySpecificData: { opReturnData: "6869", feePerByte: "12", utxoStrategy } });
  });

  it("reads the shape getCustomFeesPerFamily hands the live app", () => {
    const transaction = {
      family: "bitcoin",
      familySpecificData: { utxoStrategy },
      feeParameters: { feePerByte: "7" },
    };
    expect(getBitcoinCustomFeesPatch({}, getCustomFeesPerFamily(transaction))).toEqual({
      familySpecificData: { feePerByte: "7", utxoStrategy },
    });
    expect(getBitcoinCustomFeesPatch({}, { feePerByte: new BigNumber(9) })).toEqual({
      familySpecificData: { feePerByte: "9" },
    });
  });

  it.each([undefined, null, "not-a-rate"])("ignores a rate of %j", feePerByte => {
    expect(
      getBitcoinCustomFeesPatch({ familySpecificData: { feePerByte: "3" } }, { feePerByte }),
    ).toEqual({
      familySpecificData: { feePerByte: "3" },
    });
  });

  it("changes nothing without settings", () => {
    expect(getBitcoinCustomFeesPatch({}, undefined)).toEqual({ familySpecificData: {} });
    expect(getBitcoinCustomFeesPatch({}, null)).toEqual({ familySpecificData: {} });
  });
});
