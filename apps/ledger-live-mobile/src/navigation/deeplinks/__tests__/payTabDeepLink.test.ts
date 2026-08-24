import { PAY_TAB_DEEP_LINK, PAY_TAB_DEEP_LINK_PATH } from "../payTabDeepLink";

describe("PAY_TAB_DEEP_LINK", () => {
  // Pinned on purpose. `go.ledger.com/ledger/card-baanx` redirects the Card login to this exact URL,
  // and that target is configured outside this repo. A change here without a change there stops the
  // secure browser from closing itself.
  it("is the URL go.ledger.com redirects the Card login to", () => {
    expect(PAY_TAB_DEEP_LINK).toBe("ledgerlive://paytab");
  });

  it("is built from the path the linking config maps onto the Pay tab", () => {
    expect(PAY_TAB_DEEP_LINK).toBe(`ledgerlive://${PAY_TAB_DEEP_LINK_PATH}`);
  });
});
