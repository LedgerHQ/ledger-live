import { bodyOf, describeSent, REQUESTS } from "./requests";
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
    ["listNetworks", "GET", "https://svc.test/v1/networks"],
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

  it.each([
    ["getLastBlock", "GET", "https://svc.test/v1/ethereum/last-block"],
    ["getValidators", "GET", "https://svc.test/v1/ethereum/validators?cursor=c1"],
    ["validateAddress", "GET", "https://svc.test/v1/ethereum/validate-address?address=0xabc"],
    ["getNextSequence", "GET", "https://svc.test/v1/ethereum/account/0xabc/next-sequence"],
    ["estimateFee", "POST", "https://svc.test/v1/ethereum/transaction/estimate"],
    ["encodeTransaction", "POST", "https://svc.test/v1/ethereum/transaction/encode"],
    ["combineTransaction", "POST", "https://svc.test/v1/ethereum/transaction/combine"],
    ["broadcastTransaction", "POST", "https://svc.test/v1/ethereum/transaction/broadcast"],
  ] as const)("%s is %s %s", (action, method, url) => {
    expect(sent(action, { network: "ethereum", address: "0xabc", cursor: "c1" })).toMatchObject({
      method,
      url,
    });
  });

  it("builds the bodies from the typed fields", () => {
    const intentJson = '{"type":"send-eip1559","sender":"0x1"}';
    expect(bodyOf(request("removeRegistrations", { registrationIds: ["a", "b"] }))).toEqual([
      "a",
      "b",
    ]);
    expect(bodyOf(request("addAddresses", { addresses: ["0x1"] }))).toEqual({
      type: "account",
      addresses: ["0x1"],
    });
    expect(bodyOf(request("estimateFee", { intentJson }))).toEqual({
      intent: { type: "send-eip1559", sender: "0x1" },
    });
    expect(bodyOf(request("encodeTransaction", { intentJson, customFees: "5" }))).toEqual({
      intent: { type: "send-eip1559", sender: "0x1" },
      customFees: "5",
    });
    expect(
      bodyOf(request("combineTransaction", { rawTransaction: "0xraw", signature: "0xsig" })),
    ).toEqual({ rawTransaction: "0xraw", signature: "0xsig", pubkey: undefined });
    expect(bodyOf(request("broadcastTransaction", { signedTransaction: "0xs" }))).toEqual({
      signedTransaction: "0xs",
    });
    expect(bodyOf(request("getBalance"))).toBeUndefined();
  });

  it("throws a SyntaxError when the intent or the registrations are not JSON", () => {
    expect(() => bodyOf(request("estimateFee", { intentJson: "{" }))).toThrow(SyntaxError);
    expect(() => bodyOf(request("registerAccounts", { registrationsJson: "[" }))).toThrow(
      SyntaxError,
    );
  });

  it("has an entry for every action it lists", () => {
    expect(Object.keys(REQUESTS)).toHaveLength(17);
  });
});
