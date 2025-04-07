import { DeviceBusyError, OpeningConnectionError } from "@ledgerhq/device-management-kit";
import {
  isAllowedOnboardingStatePollingErrorDmk,
  isDmkError,
  isiOSPeerRemovedPairingError,
} from "./errors";
import { expect } from "vitest";
import { BleError } from "react-native-ble-plx";

describe("errors", () => {
  describe("isAllowedOnboardingStatePollingErrorDmk", () => {
    it("should return true if the error is a DeviceBusyError", () => {
      expect(isAllowedOnboardingStatePollingErrorDmk(new DeviceBusyError())).toBe(true);
    });

    it("should return false if the error is not a DeviceBusyError or WebHidSendReportError", () => {
      expect(isAllowedOnboardingStatePollingErrorDmk(new Error())).toBe(false);
    });

    it("should return false if the error is undefined", () => {
      expect(isAllowedOnboardingStatePollingErrorDmk(undefined)).toBe(false);
    });
  });

  describe("isDmkError", () => {
    it("should return true if the error is a DMK error", () => {
      expect(isDmkError(new DeviceBusyError())).toBe(true);
    });

    it("should return false if the error is not a DMK error", () => {
      expect(isDmkError(new Error("error"))).toBe(false);
    });

    it("should return false if the error is undefined", () => {
      expect(isDmkError(undefined)).toBe(false);
    });
  });

  describe("isiOSPeerRemovedPairingError", () => {
    it("should return false if dmk error is invalid", () => {
      expect(isiOSPeerRemovedPairingError(new OpeningConnectionError())).toBe(false);
    });

    it("should return true if dmk error is valid", () => {
      const bleError = new BleError("Peer removed pairing information", {} as any);
      expect(isiOSPeerRemovedPairingError(new OpeningConnectionError(bleError))).toBe(true);
    });

    it("should return false if the error is undefined", () => {
      expect(isiOSPeerRemovedPairingError(undefined)).toBe(false);
    });
  });
});
