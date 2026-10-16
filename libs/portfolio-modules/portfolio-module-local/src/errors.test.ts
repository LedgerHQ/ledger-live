import { toErrorView } from "./errors";

class FieldsError extends Error {
  constructor(message: string, fields: Record<string, unknown>, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "FieldsError";
    Object.assign(this, fields);
  }
}

/** An axios `AxiosError` as axios builds it: own enumerable fields, circular request and response. */
class AxiosError extends Error {
  readonly isAxiosError = true;
  code: string;
  config: unknown;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  status: number;

  constructor(message: string) {
    super(message);
    this.message = message;
    this.name = "AxiosError";
    this.code = "ERR_BAD_REQUEST";
    this.config = {
      url: "https://explorer.example/v1/address?apiKey=secret",
      headers: { authorization: "Bearer secret" },
    };
    this.request = { method: "GET" };
    this.response = { status: 405, request: this.request, config: this.config };
    this.request.res = this.response;
    this.status = 405;
  }

  toJSON() {
    return { message: this.message, config: this.config };
  }
}

/** `@ledgerhq/errors`' `LedgerAPIError`: a custom error class carrying the request's fields. */
class LedgerAPIError extends Error {
  constructor(message: string, fields: { status: number; url: string; method: string }) {
    super(message);
    this.name = "LedgerAPIError";
    Object.assign(this, fields);
  }
}

describe("toErrorView", () => {
  it("keeps the name, the message and the own fields in JSON form", () => {
    const error = new FieldsError("Not enough balance", {
      amount: 10n,
      at: new Date("2026-01-01T00:00:00.000Z"),
      details: { fees: [1n, 2n] },
      missing: undefined,
      format: () => "dropped",
    });

    expect(toErrorView(error)).toEqual({
      name: "FieldsError",
      message: "Not enough balance",
      amount: "10",
      at: "2026-01-01T00:00:00.000Z",
      details: { fees: ["1", "2"] },
    });
  });

  it("keeps an HTTP client error's code and status, never its request, response nor config", () => {
    const view = toErrorView(new AxiosError("Request failed with status code 405"));

    expect(view).toEqual({
      name: "AxiosError",
      message: "Request failed with status code 405",
      isAxiosError: true,
      code: "ERR_BAD_REQUEST",
      status: 405,
    });
    expect(JSON.stringify(view)).not.toContain("secret");
  });

  it("keeps a Ledger API error's fields", () => {
    const error = new LedgerAPIError("API HTTP 404", {
      status: 404,
      url: "https://explorer.example/v1/tx",
      method: "GET",
    });

    expect(toErrorView(error)).toEqual({
      name: "LedgerAPIError",
      message: "API HTTP 404",
      status: 404,
      url: "https://explorer.example/v1/tx",
      method: "GET",
    });
  });

  it("drops a field that is circular or whose JSON form is too long", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const error = new FieldsError("failed", {
      circular,
      long: "x".repeat(4094),
      tooLong: "x".repeat(4095),
    });

    expect(toErrorView(error)).toEqual({
      name: "FieldsError",
      message: "failed",
      long: "x".repeat(4094),
    });
  });

  it("keeps up to three causes that are errors", () => {
    const chain = [4, 3, 2, 1].reduce<Error>(
      (cause, depth) => new FieldsError(`depth ${depth}`, {}, { cause }),
      new Error("depth 5"),
    );
    const notAnError = new FieldsError("outer", {}, { cause: "timeout" });

    expect(toErrorView(chain)).toEqual({
      name: "FieldsError",
      message: "depth 1",
      cause: {
        name: "FieldsError",
        message: "depth 2",
        cause: {
          name: "FieldsError",
          message: "depth 3",
          cause: { name: "FieldsError", message: "depth 4" },
        },
      },
    });
    expect(toErrorView(notAnError)).toEqual({ name: "FieldsError", message: "outer" });
  });

  it("makes anything else thrown an error of its string", () => {
    expect(toErrorView("timeout")).toEqual({ name: "Error", message: "timeout" });
    expect(toErrorView(404)).toEqual({ name: "Error", message: "404" });
  });
});
