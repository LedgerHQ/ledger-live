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
const sent = (action: PortfolioAction, rest?: Partial<PortfolioRequest>) =>
  describeSent("https://svc.test/", request(action, rest), undefined);

describe("REQUESTS", () => {
  it.each([
    ["getPortfolio", "GET", "https://svc.test/v1/portfolio/p%201"],
    ["createPortfolio", "PUT", "https://svc.test/v1/portfolio/p%201"],
    ["registerAccounts", "POST", "https://svc.test/v1/portfolio/p%201/registrations"],
    ["removeRegistrations", "DELETE", "https://svc.test/v1/portfolio/p%201/registrations"],
    ["getBalance", "GET", "https://svc.test/v1/portfolio/p%201/balance?currency=usd"],
    ["getUpdates", "GET", "https://svc.test/v1/portfolio/p%201/updates?currency=usd"],
  ] as const)("%s is %s %s", (action, method, url) => {
    expect(sent(action)).toMatchObject({ method, url });
  });

  it("filters balance and history on the account, and the history on its range", () => {
    expect(sent("getBalance", { account: "base:0x1" }).url).toBe(
      "https://svc.test/v1/portfolio/p%201/balance?currency=usd&account=base%3A0x1",
    );
    expect(sent("getBalanceHistory", { range: "week" }).url).toBe(
      "https://svc.test/v1/portfolio/p%201/balance/history?currency=usd&range=week",
    );
  });

  it("puts the account in the route to add addresses to it", () => {
    expect(sent("addAddresses", { addressAccountId: "base:0xabc" })).toMatchObject({
      method: "POST",
      url: "https://svc.test/v1/portfolio/p%201/accounts/base%3A0xabc/addresses",
    });
  });

  it("builds the bodies from the typed fields", () => {
    expect(bodyOf(request("removeRegistrations", { registrationIds: ["a", "b"] }))).toEqual([
      "a",
      "b",
    ]);
    expect(bodyOf(request("addAddresses", { addresses: ["0x1"] }))).toEqual({
      type: "account",
      addresses: ["0x1"],
    });
    expect(bodyOf(request("getBalance"))).toBeUndefined();
  });

  it("throws a SyntaxError when the registrations are not JSON", () => {
    expect(() => bodyOf(request("registerAccounts", { registrationsJson: "[" }))).toThrow(
      SyntaxError,
    );
  });
});

describe("getBalanceHistory page token", () => {
  it("sends the token of the page to read", () => {
    const described = describeSent(
      "https://svc",
      {
        action: "getBalanceHistory",
        portfolioId: "p",
        currency: "usd",
        range: "week",
        pageToken: "abc",
      },
      undefined,
    );
    expect(described.url).toContain("token=abc");
  });
});
