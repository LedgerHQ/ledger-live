import { getFlashMcuOrBootloaderDetails } from "./updateFirmware";

test("getFlashMcuOrBootloaderDetails", () => {
  // MCU Update
  expect(getFlashMcuOrBootloaderDetails("1.91.0", "1.91.0")).toEqual({
    bootloaderVersion: "1.91.0",
    isMcuUpdate: true,
  });

  // Bootloader Update
  expect(getFlashMcuOrBootloaderDetails("1.90.1", "1.91.0")).toEqual({
    bootloaderVersion: "1.91.0",
    isMcuUpdate: false,
  });

  // Bootloader version majMin formatting
  expect(getFlashMcuOrBootloaderDetails("1.90.1", "1.91.0.whatever-it-doesnt-matter")).toEqual({
    bootloaderVersion: "1.91.0",
    isMcuUpdate: false,
  });
});
