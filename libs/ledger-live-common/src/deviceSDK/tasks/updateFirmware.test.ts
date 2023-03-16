import { getFlashMcuOrBootloaderDetails } from "./updateFirmware";

test("getFlashMcuOrBootloaderDetails", () => {
  // MCU Update
  expect(getFlashMcuOrBootloaderDetails("1.91", "1.91")).toEqual({
    bootloaderVersion: "1.91",
    isMcuUpdate: true,
  });

  // Bootloader Update
  expect(getFlashMcuOrBootloaderDetails("1.90", "1.91")).toEqual({
    bootloaderVersion: "1.91",
    isMcuUpdate: false,
  });

  // Bootloader version majMin formatting
  expect(
    getFlashMcuOrBootloaderDetails("1.90", "1.91.whatever-it-doesnt-matter")
  ).toEqual({
    bootloaderVersion: "1.91",
    isMcuUpdate: false,
  });
});
