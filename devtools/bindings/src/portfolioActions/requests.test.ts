import { bodyOf, describeSent } from "./requests";
import type { PortfolioAction, PortfolioRequest } from "./types";

const request = (
  action: PortfolioAction,
  rest: Partial<PortfolioRequest> = {},
): PortfolioRequest => ({
  action,
  portfolioId: "p 1",
  currency: "usd",
  ...rest,
});

describe("describeSent", () => {
  it("encodes the portfolio id and the account filter", () => {
    expect(
      describeSent("https://svc.test/", request("getBalance", { account: "base:0x1" }), undefined),
    ).toMatchObject({
      method: "GET",
      url: "https://svc.test/v1/portfolio/p%201/balance?currency=usd&account=base%3A0x1",
    });
  });
});

describe("bodyOf", () => {
  it("builds a write body and sends nothing for a read", () => {
    expect(bodyOf(request("addAddresses", { addresses: ["0x1"] }))).toEqual({
      type: "account",
      addresses: ["0x1"],
    });
    expect(bodyOf(request("getBalance"))).toBeUndefined();
  });

  it("throws when the registrations are not JSON", () => {
    expect(() => bodyOf(request("registerAccounts", { registrationsJson: "[" }))).toThrow(
      SyntaxError,
    );
  });
});
