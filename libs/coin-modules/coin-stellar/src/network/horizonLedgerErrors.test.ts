import { LedgerAPI4xx, LedgerAPI5xx, NetworkDown } from "@ledgerhq/errors";
import { NetworkError, NotFoundError } from "@stellar/stellar-sdk";
import {
  messageFromHorizonUnknown,
  throwHorizonLedgerOrOperationsError,
} from "./horizonLedgerErrors";

describe("messageFromHorizonUnknown", () => {
  it("returns message for Error", () => {
    expect(messageFromHorizonUnknown(new Error("hello"))).toBe("hello");
  });

  it("returns string as-is", () => {
    expect(messageFromHorizonUnknown("plain")).toBe("plain");
  });

  it("returns empty string for non-Error non-string", () => {
    expect(messageFromHorizonUnknown({ code: 1 })).toBe("");
    expect(messageFromHorizonUnknown(null)).toBe("");
    expect(messageFromHorizonUnknown(undefined)).toBe("");
  });
});

describe("throwHorizonLedgerOrOperationsError", () => {
  const notFound = "ledger not found";

  it("throws notFoundMessage for NotFoundError", () => {
    expect(() =>
      throwHorizonLedgerOrOperationsError(new NotFoundError("gone", {}), notFound),
    ).toThrow(notFound);
  });

  it("throws notFoundMessage when message contains status code 404", () => {
    expect(() =>
      throwHorizonLedgerOrOperationsError(new Error("Request failed: status code 404"), notFound),
    ).toThrow(notFound);
  });

  it("throws LedgerAPI4xx 429 for too many requests in message", () => {
    expect(() =>
      throwHorizonLedgerOrOperationsError(new Error("Too Many Requests"), notFound),
    ).toThrow(LedgerAPI4xx);
  });

  it("throws LedgerAPI4xx for other 4xx status in message", () => {
    expect(() =>
      throwHorizonLedgerOrOperationsError(new Error("status code 400"), notFound),
    ).toThrow(LedgerAPI4xx);
  });

  test.each([["401"], ["403"]])(
    "throws LedgerAPI4xx when message contains status code %s",
    code => {
      expect(() =>
        throwHorizonLedgerOrOperationsError(
          new Error(`Request failed: status code ${code}`),
          notFound,
        ),
      ).toThrow(LedgerAPI4xx);
    },
  );

  it("throws LedgerAPI5xx for 5xx status in message", () => {
    expect(() =>
      throwHorizonLedgerOrOperationsError(new Error("status code 503"), notFound),
    ).toThrow(LedgerAPI5xx);
  });

  test.each([["502"], ["500"]])(
    "throws LedgerAPI5xx when message contains status code %s",
    code => {
      expect(() =>
        throwHorizonLedgerOrOperationsError(new Error(`upstream status code ${code}`), notFound),
      ).toThrow(LedgerAPI5xx);
    },
  );

  it("throws NetworkDown for NetworkError", () => {
    expect(() =>
      throwHorizonLedgerOrOperationsError(new NetworkError("net", {}), notFound),
    ).toThrow(NetworkDown);
  });

  test.each([
    ["ECONNRESET", "ECONNRESET on read"],
    ["ECONNREFUSED", "connect ECONNREFUSED 127.0.0.1:443"],
    ["ENOTFOUND", "getaddrinfo ENOTFOUND horizon.example"],
    ["EPIPE", "write EPIPE broken pipe"],
    ["ETIMEDOUT", "connect ETIMEDOUT 10.0.0.1:443"],
  ])("throws NetworkDown when message contains %s", (_label, message) => {
    expect(() => throwHorizonLedgerOrOperationsError(new Error(message), notFound)).toThrow(
      NetworkDown,
    );
  });

  it("throws NetworkDown for undefined is not an object in message", () => {
    expect(() =>
      throwHorizonLedgerOrOperationsError(new Error("undefined is not an object"), notFound),
    ).toThrow(NetworkDown);
  });

  it("rethrows unknown errors", () => {
    const o = { custom: true };
    try {
      throwHorizonLedgerOrOperationsError(o, notFound);
    } catch (e) {
      expect(e).toBe(o);
      return;
    }
    throw new Error("expected throw");
  });
});
