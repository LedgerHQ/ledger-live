import { pltRejectCode } from "./pltRejectCode";

describe("pltRejectCode", () => {
  it("names a token id the chain does not know", () => {
    expect(pltRejectCode({ tag: "NonExistentTokenId", contents: "t-USDT" })).toBe(
      "nonExistentToken",
    );
  });

  it.each([
    ["addressNotFound", "recipientNotFound"],
    ["tokenBalanceInsufficient", "insufficientBalance"],
  ])("narrows the module reject type %s", (type, expected) => {
    expect(
      pltRejectCode({
        tag: "TokenUpdateTransactionFailed",
        contents: { tokenId: "t-USDT", type },
      }),
    ).toBe(expected);
  });

  // Each of these is a real CIS-7 type that says nothing the sender can act on,
  // so naming it would be worse than the generic cause, not better.
  it.each([
    "operationNotPermitted",
    "deserializationFailure",
    "unsupportedOperation",
    "mintWouldOverflow",
  ])("falls through to the generic cause for %s", type => {
    expect(
      pltRejectCode({
        tag: "TokenUpdateTransactionFailed",
        contents: { tokenId: "t-USDT", type },
      }),
    ).toBe("rejected");
  });

  // The type set is module-defined and the node truncates it to 255 bytes
  // without revalidating UTF-8, so an unrecognised or mangled value is expected
  // input. It must land on a code, never be passed through.
  it.each([
    ["a module-defined type", "someModuleSaysNo"],
    ["an empty type", ""],
    ["a replacement character", "��"],
    ["a prototype key", "constructor"],
    ["another prototype key", "toString"],
  ])("maps %s to the generic cause", (_label, type) => {
    expect(
      pltRejectCode({
        tag: "TokenUpdateTransactionFailed",
        contents: { tokenId: "t-USDT", type },
      }),
    ).toBe("rejected");
  });

  it("returns undefined when there is no reason", () => {
    expect(pltRejectCode(undefined)).toBeUndefined();
  });

  // A CCD failure reaches the same parser. Giving it a PLT cause would explain
  // the wrong thing.
  it("returns undefined for another transaction kind's reason", () => {
    expect(pltRejectCode({ tag: "InvalidAccountReference" })).toBeUndefined();
  });

  // `contents` is `unknown` off the wire, so a tag match alone would assert a
  // shape nothing verified.
  it.each([
    ["a token id that is not a string", { tag: "NonExistentTokenId", contents: 7 }],
    [
      "module contents that are not an object",
      { tag: "TokenUpdateTransactionFailed", contents: 7 },
    ],
    [
      "module contents missing the type",
      { tag: "TokenUpdateTransactionFailed", contents: { tokenId: "t-USDT" } },
    ],
  ])("returns undefined for %s", (_label, reason) => {
    expect(pltRejectCode(reason)).toBeUndefined();
  });
});
