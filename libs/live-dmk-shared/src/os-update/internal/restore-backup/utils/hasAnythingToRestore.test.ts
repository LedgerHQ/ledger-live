import type { Backup } from "@ledgerhq/dmk-ledger-wallet";
import { ENGLISH_LANGUAGE_ID } from "../constants";
import { hasAnythingToRestore } from "./hasAnythingToRestore";

const FRENCH_LANGUAGE_ID = 1;

const backup = (overrides: Partial<Backup> = {}): Backup => ({
  languageId: undefined,
  installedApps: [],
  clsHexImage: undefined,
  createdAt: new Date("2026-09-15T12:00:00.000Z"),
  ...overrides,
});

describe("hasAnythingToRestore", () => {
  describe("success", () => {
    it("should restore a language other than english", () => {
      expect(hasAnythingToRestore(backup({ languageId: FRENCH_LANGUAGE_ID }))).toBe(true);
    });

    it("should restore when at least one app was backed up", () => {
      expect(
        hasAnythingToRestore(backup({ installedApps: [{ appName: "Bitcoin", data: undefined }] })),
      ).toBe(true);
    });

    it("should restore a custom lock screen", () => {
      expect(hasAnythingToRestore(backup({ clsHexImage: "00ff" }))).toBe(true);
    });
  });

  describe("error", () => {
    it("should skip when there is no backup", () => {
      expect(hasAnythingToRestore(undefined)).toBe(false);
    });

    it("should skip an empty backup", () => {
      expect(hasAnythingToRestore(backup())).toBe(false);
    });

    it("should skip english, which is already on the device", () => {
      expect(hasAnythingToRestore(backup({ languageId: ENGLISH_LANGUAGE_ID }))).toBe(false);
    });
  });
});
