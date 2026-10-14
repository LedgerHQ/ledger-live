import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import type { Portfolio } from "@ledgerhq/portfolio-module-framework";
import { mergePortfolios, orNotFound, ownsAccount, ownsRegistration } from "./portfolios";

const local: Portfolio = {
  id: "p1",
  registrations: [{ type: "auto_derive", id: "reg-l", network: "bitcoin", xpub: "xpub" }],
  accounts: [{ id: "acc-l", network: "bitcoin", status: "synchronized" }],
};
const remote: Portfolio = {
  id: "p1",
  registrations: [{ type: "evm", id: "reg-r", address: "0xabc" }],
  accounts: [{ id: "acc-r", network: "ethereum", status: "synchronized" }],
};

describe("orNotFound", () => {
  it("resolves the answer", async () => {
    await expect(orNotFound(Promise.resolve(local))).resolves.toBe(local);
  });

  it("resolves undefined on NOT_FOUND", async () => {
    const notFound = new PortfolioApiError("NOT_FOUND", "missing");
    await expect(orNotFound(Promise.reject(notFound))).resolves.toBeUndefined();
  });

  it.each([new PortfolioApiError("UNAVAILABLE", "down"), new Error("boom")])(
    "rethrows %p",
    async error => {
      await expect(orNotFound(Promise.reject(error))).rejects.toBe(error);
    },
  );
});

describe("mergePortfolios", () => {
  it("concatenates the registrations and accounts, local first", () => {
    expect(mergePortfolios("p1", { local, remote })).toEqual({
      id: "p1",
      registrations: [...local.registrations!, ...remote.registrations!],
      accounts: [...local.accounts!, ...remote.accounts!],
    });
  });

  it("serves the side that knows the portfolio when the other does not", () => {
    expect(mergePortfolios("p1", { local: undefined, remote })).toEqual(remote);
  });

  it("reads a portfolio without registrations nor accounts as empty", () => {
    expect(mergePortfolios("p1", { local: { id: "p1" }, remote: undefined })).toEqual({
      id: "p1",
      registrations: [],
      accounts: [],
    });
  });

  it("answers NOT_FOUND when no side knows the portfolio", () => {
    expect(() => mergePortfolios("p1", { local: undefined, remote: undefined })).toThrow(
      expect.objectContaining({ type: "NOT_FOUND" }),
    );
  });
});

describe("ownership", () => {
  it("finds a registration and an account of a portfolio", () => {
    expect(ownsRegistration(local, "reg-l")).toBe(true);
    expect(ownsAccount(local, "acc-l")).toBe(true);
  });

  it("does not find ids of another portfolio", () => {
    expect(ownsRegistration(local, "reg-r")).toBe(false);
    expect(ownsAccount(local, "acc-r")).toBe(false);
  });

  it("finds nothing in a missing or empty portfolio", () => {
    expect(ownsRegistration(undefined, "reg-l")).toBe(false);
    expect(ownsAccount(undefined, "acc-l")).toBe(false);
    expect(ownsRegistration({ id: "p1" }, "reg-l")).toBe(false);
    expect(ownsAccount({ id: "p1" }, "acc-l")).toBe(false);
  });
});
