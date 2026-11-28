import { ContactAddressValueSchema } from "@domain/entity-contact";
import {
  applyAddressEntryIfCurrent,
  createValidatingAddressEntryState,
  EMPTY_ADDRESS_ENTRY_STATE,
  keepEnsDisclaimerWhileValidating,
  resolveAddressEntryState,
} from "./state";

describe("addressEntryState", () => {
  const resolvedAddress = ContactAddressValueSchema.parse(
    "0x1234567890123456789012345678901234567890",
  );

  it("should map valid validation results to entry state", () => {
    expect(
      resolveAddressEntryState("ens.eth", "manual", {
        status: "valid",
        resolvedAddress,
        isDomain: true,
      }),
    ).toEqual({
      status: "valid",
      value: "ens.eth",
      resolvedAddress,
      inputMethod: "ens",
    });
  });

  it("should map invalid validation results and preserve ens input method", () => {
    expect(
      resolveAddressEntryState("bad.eth", "paste", {
        status: "domain_not_found",
      }),
    ).toEqual({
      status: "invalid",
      value: "bad.eth",
      resolvedAddress: null,
      inputMethod: "ens",
      error: "domain_not_found",
    });
  });

  it("should create validating and empty entry states", () => {
    expect(createValidatingAddressEntryState("0xabc", "manual")).toEqual({
      status: "validating",
      value: "0xabc",
      resolvedAddress: null,
      inputMethod: "manual",
      keepsEnsDisclaimer: false,
    });
    expect(EMPTY_ADDRESS_ENTRY_STATE).toMatchObject({
      status: "empty",
      value: "",
    });
  });

  it("should ignore stale entry updates", () => {
    const current = createValidatingAddressEntryState("0xabc", "manual");
    const next = resolveAddressEntryState("0xabc", "manual", {
      status: "valid",
      resolvedAddress,
      isDomain: false,
    });

    expect(applyAddressEntryIfCurrent(current, next, "0xabc")).toEqual(next);
    expect(applyAddressEntryIfCurrent(current, next, "0xstale")).toEqual(current);
  });

  describe("keepEnsDisclaimerWhileValidating", () => {
    const validating = createValidatingAddressEntryState("vitalik.et", "manual");
    const resolvedEns = resolveAddressEntryState("vitalik.eth", "manual", {
      status: "valid",
      resolvedAddress,
      isDomain: true,
    });
    const unknownEns = resolveAddressEntryState("ledgerliv.eth", "manual", {
      status: "domain_not_found",
    });
    const manualAddress = resolveAddressEntryState("0xabc", "manual", {
      status: "valid",
      resolvedAddress,
      isDomain: false,
    });

    it.each([
      ["a resolved ENS name", resolvedEns],
      ["an unknown ENS name", unknownEns],
      ["an ENS name being validated", { ...validating, keepsEnsDisclaimer: true }],
    ])("should keep the ENS disclaimer when the previous entry was %s", (_, previousEntry) => {
      expect(keepEnsDisclaimerWhileValidating(previousEntry, validating)).toEqual({
        ...validating,
        keepsEnsDisclaimer: true,
      });
    });

    it.each([
      ["a regular address", manualAddress],
      ["empty", EMPTY_ADDRESS_ENTRY_STATE],
      ["a regular address being validated", validating],
    ])("should not keep the ENS disclaimer when the previous entry was %s", (_, previousEntry) => {
      expect(keepEnsDisclaimerWhileValidating(previousEntry, validating)).toEqual(validating);
    });

    it("should leave non-validating entries untouched", () => {
      expect(keepEnsDisclaimerWhileValidating(resolvedEns, manualAddress)).toBe(manualAddress);
    });
  });
});
