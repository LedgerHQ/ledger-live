import {
  CLA_NOT_SUPPORTED_STATUS_WORD,
  INS_NOT_SUPPORTED_STATUS_WORD,
  isOpenAppError,
} from "./isOpenAppError";

describe("isOpenAppError", () => {
  describe("success", () => {
    it("should return true when the error code is the CLA not supported status word", () => {
      expect(isOpenAppError({ errorCode: CLA_NOT_SUPPORTED_STATUS_WORD })).toBe(true);
    });

    it("should return true when the error code is the INS not supported status word", () => {
      expect(isOpenAppError({ errorCode: INS_NOT_SUPPORTED_STATUS_WORD })).toBe(true);
    });

    it("should return true when the status code bytes are 0x6e00", () => {
      expect(isOpenAppError({ statusCode: new Uint8Array([0x6e, 0x00]) })).toBe(true);
    });

    it("should return true when the status code bytes are 0x6d00", () => {
      expect(isOpenAppError({ statusCode: new Uint8Array([0x6d, 0x00]) })).toBe(true);
    });

    it("should return true when a nested error is an open app error", () => {
      expect(isOpenAppError({ error: { errorCode: INS_NOT_SUPPORTED_STATUS_WORD } })).toBe(true);
    });
  });

  describe("error", () => {
    it("should return false when the value is not an object", () => {
      expect(isOpenAppError(undefined)).toBe(false);
      expect(isOpenAppError("6e00")).toBe(false);
    });

    it("should return false when the value is null", () => {
      expect(isOpenAppError(null)).toBe(false);
    });

    it("should return false when the status code is not a long enough byte array", () => {
      expect(isOpenAppError({ statusCode: new Uint8Array([0x6e]) })).toBe(false);
      expect(isOpenAppError({ statusCode: [0x6e, 0x00] })).toBe(false);
    });

    it("should return false for the bootloader CLA not supported status word", () => {
      expect(isOpenAppError({ errorCode: "6e01" })).toBe(false);
      expect(isOpenAppError({ statusCode: new Uint8Array([0x6e, 0x01]) })).toBe(false);
    });

    it("should return false for the device-locked status word", () => {
      expect(isOpenAppError({ errorCode: "5515" })).toBe(false);
    });
  });
});
