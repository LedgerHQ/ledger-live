import { firstValueFrom } from "rxjs";
import {
  handleContactDeviceActionTransportError,
  mapDeviceActionErrorToFailureJobState,
  mapDmkErrorToError,
  throwIfDeviceDisconnected,
} from "./contactsDeviceActionFailure";

describe("mapDmkErrorToError", () => {
  it("GIVEN an Error instance WHEN mapping THEN it returns it as-is", () => {
    // GIVEN
    const error = new Error("boom");

    // WHEN
    const result = mapDmkErrorToError(error);

    // THEN
    expect(result).toBe(error);
  });

  it("GIVEN a DmkError with a message field WHEN mapping THEN it builds an Error from that message", () => {
    // WHEN
    const result = mapDmkErrorToError({ _tag: "ContactsValidationError", message: "bad scope" });

    // THEN
    expect(result.message).toBe("bad scope");
  });

  it("GIVEN a DmkError with only an originalError WHEN mapping THEN it returns the originalError", () => {
    // GIVEN
    const originalError = new Error("device locked");

    // WHEN
    const result = mapDmkErrorToError({ _tag: "DeviceLockedError", originalError });

    // THEN
    expect(result).toBe(originalError);
  });

  it("GIVEN a bare tagged value WHEN mapping THEN it falls back to the tag as the message", () => {
    // WHEN
    const result = mapDmkErrorToError({ _tag: "UnknownDAError" });

    // THEN
    expect(result.message).toBe("UnknownDAError");
  });

  it("GIVEN a value with no usable field WHEN mapping THEN it falls back to a generic message", () => {
    // WHEN
    const result = mapDmkErrorToError({});

    // THEN
    expect(result.message).toBe("Contacts device intent failed");
  });
});

describe("mapDeviceActionErrorToFailureJobState", () => {
  it("GIVEN a ContactsVersionRequirementError WHEN mapping THEN it returns app-version-too-low", () => {
    // WHEN
    const result = mapDeviceActionErrorToFailureJobState({
      _tag: "ContactsVersionRequirementError",
    });

    // THEN
    expect(result.type).toBe("app-version-too-low");
  });

  it("GIVEN a ContactsValidationError WHEN mapping THEN it returns invalid-input", () => {
    // WHEN
    const result = mapDeviceActionErrorToFailureJobState({ _tag: "ContactsValidationError" });

    // THEN
    expect(result.type).toBe("invalid-input");
  });

  it("GIVEN an ActionRefusedError WHEN mapping THEN it returns device-rejected", () => {
    // WHEN
    const result = mapDeviceActionErrorToFailureJobState({
      _tag: "ActionRefusedError",
      errorCode: "5501",
      message: "Action refused on device.",
    });

    // THEN
    expect(result.type).toBe("device-rejected");
    expect(result.error.message).toBe("Action refused on device.");
  });

  it.each([
    ["6a80", "device-rejected"],
    ["6982", "existing-group-verification-failed"],
    ["6984", "unsupported-operation"],
    ["6b00", "failed"],
    // Status words are commonly surfaced uppercase; the mapping is case-insensitive.
    ["6A80", "device-rejected"],
  ])(
    "GIVEN a ContactsCommandError with status word %s WHEN mapping THEN it returns %s",
    (errorCode, type) => {
      // WHEN
      const result = mapDeviceActionErrorToFailureJobState({
        _tag: "ContactsCommandError",
        errorCode,
      });

      // THEN
      expect(result.type).toBe(type);
    },
  );

  it("GIVEN a ContactsCommandError with a non-string errorCode WHEN mapping THEN it returns failed", () => {
    // WHEN
    const result = mapDeviceActionErrorToFailureJobState({
      _tag: "ContactsCommandError",
      errorCode: undefined,
    });

    // THEN
    expect(result.type).toBe("failed");
  });

  it("GIVEN an unrecognized DmkError WHEN mapping THEN it returns failed", () => {
    // WHEN
    const result = mapDeviceActionErrorToFailureJobState({ _tag: "UnknownDAError" });

    // THEN
    expect(result.type).toBe("failed");
  });
});

describe("throwIfDeviceDisconnected", () => {
  it("GIVEN a device disconnect WHEN checked THEN it throws that error", () => {
    const error = { _tag: "DeviceDisconnectedWhileSendingError" };

    expect(() => throwIfDeviceDisconnected(error)).toThrow(expect.objectContaining(error));
  });

  it("GIVEN any other error WHEN checked THEN it does not throw", () => {
    expect(() => throwIfDeviceDisconnected({ _tag: "UnknownDAError" })).not.toThrow();
  });
});

describe("handleContactDeviceActionTransportError", () => {
  it.each([
    ["a send disconnect", { _tag: "DeviceDisconnectedWhileSendingError" }],
    ["a WebHID send failure", { _tag: "WebHidSendReportError" }],
    ["a wrapped WebHID send failure", { err: { _tag: "WebHidSendReportError" } }],
  ] as const)(
    "GIVEN %s WHEN handling THEN it reports the failure and rethrows",
    async (_label, error) => {
      const report = jest.fn();

      await expect(
        firstValueFrom(handleContactDeviceActionTransportError(error, report)),
      ).rejects.toBe(error);
      expect(report).toHaveBeenCalledWith(expect.any(Error));
    },
  );

  it("GIVEN another transport error WHEN handling THEN it reports a terminal failed state", async () => {
    const error = new Error("boom");
    const report = jest.fn();

    await expect(
      firstValueFrom(handleContactDeviceActionTransportError(error, report)),
    ).resolves.toEqual({
      type: "failed",
      error,
    });
    expect(report).toHaveBeenCalledWith(error);
  });
});
