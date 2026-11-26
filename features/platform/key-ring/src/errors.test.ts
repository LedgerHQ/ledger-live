import {
  NoTrustchainInitialized,
  QRCodeWSClosed,
  TrustchainEjected,
  TrustchainNotAllowed,
  TrustchainNotFound,
  TrustchainOutdated,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import {
  classifyKeyRingError,
  isKeyRingError,
  KeyRingError,
  KeyRingMemberRemovedError,
  KeyRingNetworkError,
  KeyRingNotAllowedError,
  KeyRingOutdatedError,
  KeyRingPairingClosedError,
  keyRingErrorForDisplay,
  KeyRingTreeNotFoundError,
  toKeyRingError,
} from "./errors";

function named(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

describe("classifyKeyRingError", () => {
  it.each([
    [new TrustchainEjected(), "member-removed"],
    [new TrustchainNotAllowed(), "not-allowed"],
    [new TrustchainNotFound(), "tree-not-found"],
    [new NoTrustchainInitialized(), "no-tree-for-seed"],
    [new TrustchainOutdated(), "outdated"],
    [new QRCodeWSClosed(), "pairing-closed"],
    [named("TrustchainAlreadyInitialized"), "already-member"],
    [named("TrustchainAlreadyInitializedWithOtherSeed"), "member-of-other-tree"],
    [named("UserRefusedOnDevice"), "user-refused"],
    [named("NetworkDown"), "network"],
    [named("LedgerAPI5xx"), "network"],
    [named("ScannedOldImportQrCode"), "pairing-outdated-qr-code"],
  ])("classifies the v1 error %s", (error, category) => {
    expect(classifyKeyRingError(error)).toBe(category);
  });

  it("classifies a v1 error that lost its prototype by name", () => {
    expect(classifyKeyRingError({ name: "TrustchainEjected", message: "" })).toBe("member-removed");
  });

  it("classifies our own errors, including after serialization", () => {
    expect(classifyKeyRingError(new KeyRingOutdatedError())).toBe("outdated");
    expect(classifyKeyRingError({ name: "KeyRingNetworkError" })).toBe("network");
  });

  it.each(["no-tree-for-seed", "already-member", "user-refused"] as const)(
    "keeps the %s category of a base KeyRingError after a JSON round trip",
    category => {
      const serialized = JSON.parse(JSON.stringify(new KeyRingError(category)));
      expect(classifyKeyRingError(serialized)).toBe(category);
      expect(toKeyRingError(serialized)?.category).toBe(category);
    },
  );

  it("ignores a category on an object that is not a key ring error", () => {
    expect(classifyKeyRingError({ name: "OtherError", category: "network" })).toBeUndefined();
    expect(classifyKeyRingError({ category: "network" })).toBeUndefined();
    const unknownCategory = { name: "KeyRingError", category: "unknown-category" };
    expect(classifyKeyRingError(unknownCategory)).toBeUndefined();
  });

  it("leaves other errors unclassified", () => {
    expect(classifyKeyRingError(new Error("boom"))).toBeUndefined();
    expect(classifyKeyRingError(named("LedgerAPI4xx"))).toBeUndefined();
    expect(classifyKeyRingError("TrustchainEjected")).toBeUndefined();
    expect(classifyKeyRingError(null)).toBeUndefined();
  });

  it("checks one category with isKeyRingError", () => {
    expect(isKeyRingError(new TrustchainEjected(), "member-removed")).toBe(true);
    expect(isKeyRingError(new TrustchainEjected(), "not-allowed")).toBe(false);
  });
});

describe("toKeyRingError", () => {
  it.each([
    [new TrustchainEjected(), KeyRingMemberRemovedError],
    [new TrustchainNotFound(), KeyRingTreeNotFoundError],
    [new TrustchainOutdated(), KeyRingOutdatedError],
    [new TrustchainNotAllowed(), KeyRingNotAllowedError],
    [named("NetworkDown"), KeyRingNetworkError],
  ])("maps %s to its typed class and keeps the cause", (error, TypedError) => {
    const mapped = toKeyRingError(error);
    expect(mapped).toBeInstanceOf(TypedError);
    expect(mapped?.cause).toBe(error);
  });

  it("maps a category without a dedicated class to the base class", () => {
    const error = new NoTrustchainInitialized();
    const mapped = toKeyRingError(error);
    expect(mapped).toBeInstanceOf(KeyRingError);
    expect(mapped?.category).toBe("no-tree-for-seed");
    expect(mapped?.cause).toBe(error);
  });

  it("returns a key ring error as is", () => {
    const error = new KeyRingOutdatedError();
    expect(toKeyRingError(error)).toBe(error);
  });

  it("returns undefined for an unrelated error", () => {
    expect(toKeyRingError(new Error("boom"))).toBeUndefined();
  });
});

describe("toKeyRingError keeps what the apps read", () => {
  it("keeps the v1 message", () => {
    expect(toKeyRingError(new TrustchainEjected("removed by another instance"))?.message).toBe(
      "removed by another instance",
    );
  });

  it("keeps how long the pairing channel stayed open", () => {
    const closed = new QRCodeWSClosed("closed", { time: 31_000 });
    const mapped = toKeyRingError(closed);
    expect(mapped).toBeInstanceOf(KeyRingPairingClosedError);
    expect(mapped).toMatchObject({ elapsedMs: 31_000, category: "pairing-closed" });
  });
});

describe("keyRingErrorForDisplay", () => {
  it("shows the original v1 error of a mapped one", () => {
    const original = new TrustchainNotAllowed();
    expect(keyRingErrorForDisplay(toKeyRingError(original))).toBe(original);
  });

  it("names a typed error after the translation of its category", () => {
    const shown = keyRingErrorForDisplay(new KeyRingMemberRemovedError("gone"));
    expect(shown).toBeInstanceOf(Error);
    expect(shown).toMatchObject({ name: "TrustchainEjected", message: "gone" });
  });

  it("leaves any other error unchanged", () => {
    const other = new Error("boom");
    expect(keyRingErrorForDisplay(other)).toBe(other);
  });
});
