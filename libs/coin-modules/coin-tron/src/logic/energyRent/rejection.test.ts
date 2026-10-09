import { EnergyRentInsufficientBalance, TronifyApiError } from "../../types/errors";
import { tronifyPayAsset } from "../constants";
import { classifyRentOrderError } from "./rejection";

describe("classifyRentOrderError", () => {
  it("names a USDT balance short of the transfer plus the rent", () => {
    expect(classifyRentOrderError(new EnergyRentInsufficientBalance())).toEqual({
      reason: "insufficientBalance",
    });
  });

  it("names a short balance from an error that lost its class across a process boundary", () => {
    const rebuilt = Object.assign(new Error("x"), { name: "EnergyRentInsufficientBalance" });

    expect(classifyRentOrderError(rebuilt)).toEqual({ reason: "insufficientBalance" });
  });

  it("offers the price of an order above the approved ceiling, rounded up to a base unit", () => {
    const error = new TronifyApiError("too dear", { rule: "ceiling", payCoinAmt: "3.5000001" });

    expect(classifyRentOrderError(error)).toEqual({
      reason: "priceAboveApproved",
      offered: { asset: tronifyPayAsset(), amount: 3_500_001n },
    });
  });

  it.each([
    ["a ceiling rejection without a price", new TronifyApiError("x", { rule: "ceiling" })],
    [
      "a ceiling rejection with an unusable price",
      new TronifyApiError("x", { rule: "ceiling", payCoinAmt: "NaN" }),
    ],
    ["another rule", new TronifyApiError("x", { rule: "payee", payCoinAmt: "3.5" })],
    ["a failed Tronify call", new TronifyApiError("x", { resCode: 500 })],
    [
      "an error that only shares the name",
      Object.assign(new Error("x"), { name: "TronifyApiError" }),
    ],
    ["a non-error", "boom"],
  ])("leaves %s to the generic failure", (_label, error) => {
    expect(classifyRentOrderError(error)).toBeNull();
  });
});
