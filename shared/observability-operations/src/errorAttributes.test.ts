import { toErrorAttributes } from "./errorAttributes";

const namedError = (name: string, fields: Record<string, unknown> = {}, cause?: unknown) =>
  Object.assign(new Error(`${name} message`, { cause }), { name }, fields);

const ethAppCommandError = (errorCode: string) => ({
  _tag: "EthAppCommandError",
  errorCode,
  message: "Unexpected device exchange error happened.",
});

describe("toErrorAttributes", () => {
  it("should send the error class name and message", () => {
    expect(toErrorAttributes(new TypeError("boom"))).toEqual({
      error_name: "TypeError",
      error_message: "boom",
    });
  });

  it("should send the class name of the cause", () => {
    const error = namedError("UnexpectedGetBalanceError", {}, namedError("LedgerAPI5xx"));

    expect(toErrorAttributes(error).error_cause_name).toBe("LedgerAPI5xx");
  });

  it("should send a device status code as hexadecimal", () => {
    const error = namedError("TransportStatusError", { statusCode: 0x5515 });

    expect(toErrorAttributes(error).error_apdu_status).toBe("0x5515");
  });

  it("should send an http status", () => {
    const error = namedError("LedgerAPI5xx", { status: 503 });

    expect(toErrorAttributes(error).error_http_status).toBe(503);
  });

  it("should ignore a status outside the http range", () => {
    const error = namedError("LedgerAPI5xx", { status: 42 });

    expect(toErrorAttributes(error).error_http_status).toBeUndefined();
  });

  it.each(["SERVER_ERROR", "ERR_NETWORK", "ECONNABORTED"])("should send the %s code", code => {
    expect(toErrorAttributes(namedError("Error", { code })).error_code).toBe(code);
  });

  it.each([
    ["a lowercase code", "invalid argument"],
    ["a code longer than 40 characters", "A".repeat(41)],
    ["a numeric code", 4001],
  ])("should drop %s", (_, code) => {
    expect(toErrorAttributes(namedError("Error", { code })).error_code).toBeUndefined();
  });

  it("should read the statuses and the code from the cause of a wrapping error", () => {
    const explorerError = namedError("LedgerAPI5xx", { status: 503, code: "ERR_BAD_RESPONSE" });
    const error = namedError("UnexpectedGetBalanceError", {}, explorerError);

    expect(toErrorAttributes(error)).toEqual({
      error_name: "UnexpectedGetBalanceError",
      error_cause_name: "LedgerAPI5xx",
      error_message: "UnexpectedGetBalanceError message",
      error_http_status: 503,
      error_code: "ERR_BAD_RESPONSE",
    });
  });

  it("should read a device status code two causes down", () => {
    const deviceError = namedError("TransportStatusError", { statusCode: 0x6e01 });
    const error = namedError("ScanError", {}, namedError("SyncError", {}, deviceError));

    expect(toErrorAttributes(error).error_apdu_status).toBe("0x6e01");
  });

  it("should prefer the fields of the error over those of its cause", () => {
    const error = namedError("LedgerAPI4xx", { status: 404 }, namedError("Inner", { status: 500 }));

    expect(toErrorAttributes(error).error_http_status).toBe(404);
  });

  it("should stop at a cause that loops back", () => {
    const error = namedError("Looping");
    Object.assign(error, { cause: error });

    expect(toErrorAttributes(error)).toEqual({
      error_name: "Looping",
      error_message: "Looping message",
    });
  });

  it("should send the message reduced to its shape, never the url or method of the error", () => {
    const url = "https://explorers.api.live.ledger.com/blockchain/v4/btc/addresses/bc1qsecret/txs";
    const error = Object.assign(new Error(`API HTTP 404 ${url}`), {
      name: "LedgerAPI4xx",
      status: 404,
      url,
      method: "GET",
    });

    expect(toErrorAttributes(error)).toEqual({
      error_name: "LedgerAPI4xx",
      error_message: "API HTTP [n] [id]",
      error_http_status: 404,
    });
  });

  it("should take the message of the first error of the chain that has one", () => {
    const error = new Error("", { cause: namedError("NetworkDown") });

    expect(toErrorAttributes(error).error_message).toBe("NetworkDown message");
  });

  it("should name a Device Management Kit error by its tag and send its status word", () => {
    expect(toErrorAttributes(ethAppCommandError("6E00"))).toEqual({
      error_name: "EthAppCommandError",
      error_message: "Unexpected device exchange error happened.",
      error_apdu_status: "0x6e00",
    });
  });

  it("should describe a Device Management Kit error a signer wraps", () => {
    const error = new Error("EthAppCommandError", { cause: ethAppCommandError("6d00") });

    expect(toErrorAttributes(error)).toEqual({
      error_name: "Error",
      error_cause_name: "EthAppCommandError",
      error_message: "EthAppCommandError",
      error_apdu_status: "0x6d00",
    });
  });

  it("should follow the original error of a Device Management Kit error", () => {
    const transportError = namedError("TransportStatusError", { statusCode: 0x5515 });
    const error = { _tag: "UnknownDeviceExchangeError", originalError: transportError };

    expect(toErrorAttributes(error)).toMatchObject({
      error_name: "UnknownDeviceExchangeError",
      error_cause_name: "TransportStatusError",
      error_apdu_status: "0x5515",
    });
  });

  it("should ignore an error code that is not a device status word", () => {
    const error = { _tag: "DeviceExchangeError", errorCode: "UNKNOWN" };

    expect(toErrorAttributes(error).error_apdu_status).toBeUndefined();
  });

  it.each([
    ["a thrown string", "boom", "string"],
    ["a thrown undefined", undefined, "undefined"],
    ["an object without a name", { reason: "boom" }, "object"],
  ])("should name %s by its type", (_, thrown, errorName) => {
    expect(toErrorAttributes(thrown)).toEqual({ error_name: errorName });
  });
});
