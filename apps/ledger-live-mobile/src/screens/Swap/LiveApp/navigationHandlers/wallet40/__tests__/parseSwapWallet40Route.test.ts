import { parseSwapWallet40Route } from "../parseSwapWallet40Route";

describe("parseSwapWallet40Route", () => {
  it("should return home route for root path", () => {
    expect(parseSwapWallet40Route("https://swap.live.app/")).toEqual({
      routeName: "home",
      headerStyle: "transparent",
      titleKey: null,
    });
  });

  it("should return quotesList route for root path with QUOTES_LIST tab", () => {
    expect(parseSwapWallet40Route("https://swap.live.app/?tab=QUOTES_LIST")).toEqual({
      routeName: "quotesList",
      headerStyle: "opaque",
      titleKey: "transfer.swap2.quotesList.title",
    });
  });

  it("should return multiStepTransaction route with default title", () => {
    expect(parseSwapWallet40Route("https://swap.live.app/multi-step-transaction")).toEqual({
      routeName: "multiStepTransaction",
      headerStyle: "opaque",
      titleKey: "transfer.swap2.twoStepApproval.title",
    });
  });

  it("should return completed multiStepTransaction title when transaction is complete", () => {
    expect(
      parseSwapWallet40Route(
        "https://swap.live.app/multi-step-transaction?transactionStatus=complete",
      ),
    ).toEqual({
      routeName: "multiStepTransaction",
      headerStyle: "opaque",
      titleKey: "transfer.swap2.twoStepApproval.completedTitle",
    });
  });

  it("should return devSettings route", () => {
    expect(parseSwapWallet40Route("https://swap.live.app/dev-settings")).toEqual({
      routeName: "devSettings",
      headerStyle: "opaque",
      titleKey: "Dev Settings",
    });
  });

  it("should return unknown route for unsupported paths", () => {
    expect(parseSwapWallet40Route("https://swap.live.app/unsupported-path")).toEqual({
      routeName: "unknown",
      headerStyle: "transparent",
      titleKey: null,
    });
  });

  it("should return unknown route for invalid URL", () => {
    expect(parseSwapWallet40Route("not-a-valid-url")).toEqual({
      routeName: "unknown",
      headerStyle: "transparent",
      titleKey: null,
    });
  });
});
