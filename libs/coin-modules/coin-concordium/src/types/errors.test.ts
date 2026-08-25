import {
  ConcordiumAppOutdatedError,
  ConcordiumInvalidPltPayloadError,
  ConcordiumSignerProtocolError,
} from "./errors";

// The PLT signer errors are constructed in live-signer-concordium, a separate
// package, so nothing in this package exercises them.
describe("types/errors — PLT signer errors", () => {
  const cases = [
    ["ConcordiumInvalidPltPayloadError", ConcordiumInvalidPltPayloadError],
    ["ConcordiumSignerProtocolError", ConcordiumSignerProtocolError],
    ["ConcordiumAppOutdatedError", ConcordiumAppOutdatedError],
  ] as const;

  it.each(cases)("%s defaults its message to its own name", (name, ErrorClass) => {
    const error = new ErrorClass();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(name);
    expect(error.message).toBe(name);
  });

  it.each(cases)("%s keeps the message it is given", (_name, ErrorClass) => {
    expect(new ErrorClass("device said no").message).toBe("device said no");
  });

  it.each(cases)("%s copies extra fields onto the instance", (_name, ErrorClass) => {
    const error = new ErrorClass("device said no", { errorCode: "6b0d" });

    expect(error).toHaveProperty("errorCode", "6b0d");
  });
});
