// built while api.ts loads: the mock lives in the factory
jest.mock("../signRawOperation", () => {
  const signRawOperation = jest.fn();
  return { buildSignRawOperation: jest.fn(() => signRawOperation) };
});
jest.mock("../signer", () => ({ __esModule: true, default: { context: "signer-context" } }));

import { bitcoinAccountLayer, computeIntentType } from "../accountLayer";
import { buildSignRawOperation } from "../signRawOperation";
import bitcoinBridgeApi, { buildIntentData } from "./api";

const signRawOperation = (buildSignRawOperation as jest.Mock).mock.results[0].value;

describe("buildIntentData", () => {
  it("forwards the rate set without a preset strategy", () => {
    expect(
      buildIntentData({ feesStrategy: "custom", familySpecificData: { feePerByte: "12" } }),
    ).toEqual({
      type: "bitcoin",
      feePerByte: "12",
    });
    expect(
      buildIntentData({ feesStrategy: null, familySpecificData: { feePerByte: "12" } }),
    ).toEqual({
      type: "bitcoin",
      feePerByte: "12",
    });
  });

  it("leaves the rate to the preset strategy", () => {
    expect(
      buildIntentData({ feesStrategy: "fast", familySpecificData: { feePerByte: "12" } }),
    ).toEqual({
      type: "bitcoin",
    });
  });

  it("ignores an empty rate and forwards the OP_RETURN data", () => {
    expect(
      buildIntentData({
        feesStrategy: "custom",
        familySpecificData: { feePerByte: "", opReturnData: "6869" },
      }),
    ).toEqual({ type: "bitcoin", opReturnData: "6869" });
    expect(buildIntentData({})).toEqual({ type: "bitcoin" });
  });
});

describe("bitcoin BridgeApi", () => {
  it("plugs the account layer in", () => {
    expect(bitcoinBridgeApi).toMatchObject({
      computeIntentType,
      buildIntentData,
      forwardsFeeParametersToCraft: true,
      shouldMergeOps: false,
      accountLayer: bitcoinAccountLayer,
      signRawOperation,
    });
    expect(buildSignRawOperation).toHaveBeenCalledWith("signer-context");
  });

  it("signs with the app of the account's currency", () => {
    expect(
      bitcoinBridgeApi.getDeviceSignOptions?.(
        {} as never,
        { currency: { id: "litecoin" } } as never,
      ),
    ).toEqual({ currencyId: "litecoin" });
  });
});
