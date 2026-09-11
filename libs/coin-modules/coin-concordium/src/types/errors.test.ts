import {
  ConcordiumAccountDenied,
  ConcordiumAccountNotAllowed,
  ConcordiumAppOutdatedError,
  ConcordiumInsufficientCcdForFee,
  ConcordiumInvalidPltPayloadError,
  ConcordiumNonExistentTokenId,
  ConcordiumPltTransferRejected,
  ConcordiumRecipientNotAllowed,
  ConcordiumRecipientNotFound,
  ConcordiumSignerProtocolError,
  ConcordiumTokenPaused,
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

// The token-state errors are raised by the pre-send checks and the broadcast
// ones by the reject-reason mapping, so nothing constructs them here either.
describe("types/errors — PLT transfer errors", () => {
  const pltErrors = [
    ConcordiumTokenPaused,
    ConcordiumAccountNotAllowed,
    ConcordiumAccountDenied,
    ConcordiumRecipientNotAllowed,
    ConcordiumInsufficientCcdForFee,
    ConcordiumNonExistentTokenId,
    ConcordiumRecipientNotFound,
    ConcordiumPltTransferRejected,
  ];
  const cases = pltErrors.map(ErrorClass => [ErrorClass.name, ErrorClass] as const);

  it.each(cases)("%s is an Error whose name survives serialization", (expectedName, ErrorClass) => {
    const error = new ErrorClass();

    expect(error).toBeInstanceOf(Error);
    // `name` is the contract across IPC and worker boundaries, where the
    // prototype is lost and `instanceof` stops working.
    expect(error.name).toBe(expectedName);
    expect(JSON.parse(JSON.stringify({ name: error.name })).name).toBe(expectedName);
  });

  it.each(cases)("%s defaults its message to its name", (expectedName, ErrorClass) => {
    expect(new ErrorClass().message).toBe(expectedName);
  });

  it.each(cases)("%s keeps an explicit message and assigns extra fields", (_name, ErrorClass) => {
    const error = new ErrorClass("boom", { tokenId: "PLT" });

    expect(error.message).toBe("boom");
    expect(error).toHaveProperty("tokenId", "PLT");
  });

  it("gives every PLT transfer error a distinct name", () => {
    const names = pltErrors.map(ErrorClass => new ErrorClass().name);

    expect(new Set(names).size).toBe(pltErrors.length);
  });
});
