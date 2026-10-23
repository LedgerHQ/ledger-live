import type { AccountPortfolioAction } from "../types";
import { needsPortfolio } from "./actionScope";

describe("needsPortfolio", () => {
  it.each<AccountPortfolioAction>([
    "getPortfolio",
    "createPortfolio",
    "registerAccounts",
    "removeRegistrations",
    "addAddresses",
    "getBalance",
    "getBalanceHistory",
    "getUpdates",
  ])("%s acts on a portfolio", action => {
    expect(needsPortfolio(action)).toBe(true);
  });

  it.each<AccountPortfolioAction>([
    "listNetworks",
    "getLastBlock",
    "getValidators",
    "validateAddress",
    "getNextSequence",
    "estimateFee",
    "encodeTransaction",
    "combineTransaction",
    "broadcastTransaction",
  ])("%s acts on a chain", action => {
    expect(needsPortfolio(action)).toBe(false);
  });
});
