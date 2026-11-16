import { RefusedByUserDAError } from "@ledgerhq/device-management-kit";
import {
  isAllowInstallFirmwareRefusedError,
  isAllowSecureConnectionRefusedError,
} from "./isPromptRefusedError";

describe("prompt refusal errors", () => {
  it("should treat a user refusal as both an install refusal and a secure connection refusal", () => {
    const error = new RefusedByUserDAError();

    expect(isAllowInstallFirmwareRefusedError(error)).toBe(true);
    expect(isAllowSecureConnectionRefusedError(error)).toBe(true);
  });

  it("should reject an unrelated error for both prompts", () => {
    const error = { _tag: "UnknownDAError" };

    expect(isAllowInstallFirmwareRefusedError(error)).toBe(false);
    expect(isAllowSecureConnectionRefusedError(error)).toBe(false);
  });
});
