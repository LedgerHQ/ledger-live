import { getSwapTermsCopy } from "../getSwapTermsCopy";

describe("getSwapTermsCopy", () => {
  it("gives every Changelly provider the Changelly terms, AML/KYC and support links", () => {
    expect(getSwapTermsCopy("changelly_v2")).toEqual({
      providerName: "changelly",
      acceptTerms: "DeviceAction.confirmSwap.changellySimplifiedAcceptTerms",
      links: [
        "https://changelly.com/terms-of-use",
        "https://changelly.com/aml-kyc",
        "https://support.changelly.com/en/support/tickets/new",
      ],
    });
  });

  it("uses the Near Intents copy for Near Intents", () => {
    expect(getSwapTermsCopy("nearintents").acceptTerms).toBe(
      "DeviceAction.confirmSwap.nearIntentsAcceptTerms",
    );
  });

  it("only links the terms of another provider, even when it has a support link", () => {
    expect(getSwapTermsCopy("cic")).toEqual({
      providerName: "cic",
      acceptTerms: "DeviceAction.confirmSwap.acceptTerms",
      links: ["https://criptointercambio.com/terms-of-use"],
    });
  });

  it("has no link for a provider it knows no terms for", () => {
    expect(getSwapTermsCopy("unknown-provider").links).toEqual([]);
  });
});
