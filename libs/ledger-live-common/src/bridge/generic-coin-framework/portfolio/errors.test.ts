import { UnexpectedGetBalanceError } from "@ledgerhq/coin-module-framework/errors";
import * as solanaErrors from "@ledgerhq/coin-solana/errors";
import * as tronErrors from "@ledgerhq/coin-tron/types/errors";
import { LedgerAPI4xx } from "@ledgerhq/live-network/errors";
import {
  isUnsupported,
  PortfolioApiError,
  type ErrorView,
} from "@ledgerhq/portfolio-module-framework";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { CurrencyRegionRestrictedError } from "../../../errors";
import { reviveError, syncErrorFromView } from "./errors";

const tron = getCryptoCurrencyById("tron");

const notEnoughGas: ErrorView = {
  name: "NotEnoughGas",
  message: "NotEnoughGas",
  fees: "1.1",
  ticker: "TRX",
  links: ["ledgerlive://buy"],
};

describe("reviveError", () => {
  it("revives an instance of the class the family's coin module throws, its fields as they came", () => {
    const error = reviveError(notEnoughGas, "tron");

    expect(error).toBeInstanceOf(tronErrors.NotEnoughGas);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: "NotEnoughGas",
      message: "NotEnoughGas",
      fees: "1.1",
      ticker: "TRX",
      links: ["ledgerlive://buy"],
    });
    // As the constructor leaves them: the name an own field, the message not enumerable.
    expect(Object.keys(error)).toEqual(["name", "fees", "ticker", "links"]);
    expect(Object.getOwnPropertyDescriptor(error, "message")).toMatchObject({
      enumerable: false,
      writable: true,
    });
    expect(error.stack).toEqual(expect.any(String));
    expect(reviveError(notEnoughGas, "solana")).toBeInstanceOf(solanaErrors.NotEnoughGas);
  });

  it("revives a view that went through JSON as the error itself would be", () => {
    const thrown = new UnexpectedGetBalanceError(
      "",
      new LedgerAPI4xx("not found", { status: 404 }),
    );
    const view = JSON.parse(
      JSON.stringify({
        name: thrown.name,
        message: thrown.message,
        cause: { name: "LedgerAPI4xx", message: "not found", status: 404 },
      }),
    );

    const error = reviveError(view);

    expect(error).toBeInstanceOf(UnexpectedGetBalanceError);
    expect(error.cause).toBeInstanceOf(LedgerAPI4xx);
    expect(error.cause).toMatchObject({ message: "not found", status: 404 });
  });

  it("revives the portfolio layer's own errors, unsupported ones telling it", () => {
    const error = reviveError({
      name: "PortfolioApiError",
      message: "call is not served",
      status: 405,
      type: "METHOD_NOT_ALLOWED",
    });

    expect(error).toBeInstanceOf(PortfolioApiError);
    expect(isUnsupported(error)).toBe(true);
  });

  it("leaves out a field the view holds as undefined", () => {
    const error = reviveError({ ...notEnoughGas, missing: undefined });
    expect(error).not.toHaveProperty("missing");
  });

  it("gives an Error of the name for a name no listed module declares", () => {
    const error = reviveError({ name: "SomethingNew", message: "new", code: "E1" }, "tron");

    expect(Object.getPrototypeOf(error)).toBe(Error.prototype);
    expect(error).toMatchObject({ name: "SomethingNew", message: "new", code: "E1" });
    expect(String(error)).toBe("SomethingNew: new");
  });

  it("revives without a stack where the engine cannot capture one", () => {
    const { captureStackTrace } = Error;
    try {
      (Error as { captureStackTrace?: unknown }).captureStackTrace = undefined;
      expect(reviveError(notEnoughGas).stack).toBeUndefined();
    } finally {
      Error.captureStackTrace = captureStackTrace;
    }
  });
});

describe("syncErrorFromView", () => {
  const checking = { config: async () => ({ checkRegionRestriction: true }) } as never;
  const notChecking = { config: async () => ({}) } as never;
  const noConfig = { config: async () => Promise.reject(new Error("no config")) } as never;
  const refused: ErrorView = {
    name: "UnexpectedGetBalanceError",
    message: "UnexpectedGetBalanceError",
    cause: { name: "LedgerAPI4xx", message: "refused", status: 405 },
  };

  it("tells a balance read the region refuses as the legacy path does, when the currency checks it", async () => {
    const error = await syncErrorFromView(refused, tron, checking, { binding: false });

    expect(error).toBeInstanceOf(CurrencyRegionRestrictedError);
    expect(error).toMatchObject({ currencyName: "Tron" });
    expect(error.cause).toBeInstanceOf(LedgerAPI4xx);
    expect(error.cause).toMatchObject({ message: "refused", status: 405 });
  });

  it.each([
    ["the currency does not check it", notChecking],
    ["the currency has no config", noConfig],
  ])("revives the failure as it is when %s", async (_, context) => {
    const error = await syncErrorFromView(refused, tron, context, { binding: false });
    expect(error).toBeInstanceOf(UnexpectedGetBalanceError);
    expect(error.cause).toBeInstanceOf(LedgerAPI4xx);
  });

  it("never tells a region on the account module path", async () => {
    const config = jest.fn(async () => ({ checkRegionRestriction: true }));
    const error = await syncErrorFromView(refused, tron, { config } as never, { binding: true });
    expect(error).toBeInstanceOf(UnexpectedGetBalanceError);
    expect(config).not.toHaveBeenCalled();
  });

  it.each([
    [
      "the portfolio layer's own",
      { name: "PortfolioApiError", message: "no", status: 405, type: "METHOD_NOT_ALLOWED" },
    ],
    ["another read's", { name: "LedgerAPI4xx", message: "refused", status: 405 }],
    ["a balance read refused otherwise", { ...refused, cause: { ...refused.cause, status: 404 } }],
    ["a balance read with no cause", { name: "UnexpectedGetBalanceError", message: "" }],
  ])("never tells a region for %s failure", async (_, view) => {
    const error = await syncErrorFromView(view as ErrorView, tron, checking, { binding: false });
    expect(error).not.toBeInstanceOf(CurrencyRegionRestrictedError);
    expect(error.name).toBe(view.name);
  });
});
