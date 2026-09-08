import { mapPltRejectReason } from "./pltRejectReason";

describe("mapPltRejectReason", () => {
  it("maps NonExistentTokenId to its own error, carrying the token id", () => {
    const error = mapPltRejectReason({ tag: "NonExistentTokenId", contents: "PLT" });

    expect(error?.name).toBe("ConcordiumNonExistentTokenId");
    expect(error).toHaveProperty("tokenId", "PLT");
  });

  it("maps addressNotFound to the recipient error", () => {
    const error = mapPltRejectReason({
      tag: "TokenUpdateTransactionFailed",
      contents: { tokenId: "PLT", type: "addressNotFound" },
    });

    expect(error?.name).toBe("ConcordiumRecipientNotFound");
  });

  it("maps tokenBalanceInsufficient to the existing insufficient-funds error", () => {
    const error = mapPltRejectReason({
      tag: "TokenUpdateTransactionFailed",
      contents: { tokenId: "PLT", type: "tokenBalanceInsufficient" },
    });

    expect(error?.name).toBe("ConcordiumInsufficientFunds");
  });

  it("degrades an unrecognised module reject type to the generic error", () => {
    const error = mapPltRejectReason({
      tag: "TokenUpdateTransactionFailed",
      contents: { tokenId: "PLT", type: "somethingTheModuleInvented" },
    });

    expect(error?.name).toBe("ConcordiumPltTransferRejected");
    expect(error).toHaveProperty("type", "somethingTheModuleInvented");
    expect(error).toHaveProperty("tokenId", "PLT");
  });

  // paused, allow-list and deny-list all arrive as this one type; the `reason`
  // that would separate them sits in `details` as CBOR this repo cannot decode.
  it("degrades operationNotPermitted to the generic error", () => {
    const error = mapPltRejectReason({
      tag: "TokenUpdateTransactionFailed",
      contents: { tokenId: "PLT", type: "operationNotPermitted", details: "a1656361757365" },
    });

    expect(error?.name).toBe("ConcordiumPltTransferRejected");
  });

  it.each(["deserializationFailure", "unsupportedOperation", "mintWouldOverflow"])(
    "degrades %s to the generic error",
    type => {
      const error = mapPltRejectReason({
        tag: "TokenUpdateTransactionFailed",
        contents: { tokenId: "PLT", type },
      });

      expect(error?.name).toBe("ConcordiumPltTransferRejected");
    },
  );

  it("does not resolve a module reject type off Object.prototype", () => {
    const error = mapPltRejectReason({
      tag: "TokenUpdateTransactionFailed",
      contents: { tokenId: "PLT", type: "constructor" },
    });

    expect(error?.name).toBe("ConcordiumPltTransferRejected");
  });

  it("returns undefined for a non-PLT reject reason", () => {
    expect(mapPltRejectReason({ tag: "InvalidAccountReference" })).toBeUndefined();
  });

  it("returns undefined when there is no reject reason", () => {
    expect(mapPltRejectReason(undefined)).toBeUndefined();
  });

  it.each([
    ["NonExistentTokenId with a non-string payload", { tokenId: "PLT" }],
    ["NonExistentTokenId with no payload", undefined],
  ])("returns undefined for %s", (_label, contents) => {
    expect(mapPltRejectReason({ tag: "NonExistentTokenId", contents })).toBeUndefined();
  });

  it.each([
    ["a missing payload", undefined],
    ["a string payload", "PLT"],
    ["a null payload", null],
    ["a payload without type", { tokenId: "PLT" }],
    ["a payload without tokenId", { type: "operationNotPermitted" }],
  ])("returns undefined for TokenUpdateTransactionFailed with %s", (_label, contents) => {
    expect(mapPltRejectReason({ tag: "TokenUpdateTransactionFailed", contents })).toBeUndefined();
  });
});
