import { parseGetVersionResponse } from "./parseGetVersionResponse";

describe("parseGetVersionResult", () => {
  it("correctly parses an arbitrary regular result buffer", () => {
    const responseBuffer = Buffer.from(
      [
        "33000004", //   targetId
        "05", //         device version length
        "322e322e33", // device version aka `rawVersion`
        "04", //         flags length
        "ee000000", //   flags
        "04", //         mcu version length
        "322e3330", //   mcu version aka `mcuVersion`
        "04", //         booloader version length
        "312e3136", //   bootloader version aka `bootloaderVersion`
        "01", //         hw version length
        "01", //         hw version aka `hardwareVersion`
        "01", //         language id length
        "00", //         language id
        "01", // ?
        "00", // ?
        "9000", //       status
      ].join(""),
      "hex",
    );

    const expectedParseResult = {
      isBootloader: false,
      rawVersion: "2.2.3",
      targetId: 855638020,
      seVersion: "2.2.3",
      mcuVersion: "2.30",
      mcuBlVersion: undefined,
      mcuTargetId: undefined,
      seTargetId: 855638020,
      flags: Buffer.from([238, 0, 0, 0]),
      bootloaderVersion: "1.16",
      hardwareVersion: 1,
      languageId: 0,
    };

    const parseResult = parseGetVersionResponse(responseBuffer);

    expect(parseResult).toEqual(expectedParseResult);
  });

  it("should handle old firmware with zero rawVersionLength", () => {
    const responseBuffer = Buffer.from(
      [
        "33000004", //   targetId
        "00", //         device version length
        "04", //         flags length
        "ee000000", //   flags
        "04", //         mcu version length
        "322e3330", //   mcu version aka `mcuVersion`
        "01", //         hw version length
        "01", //         hw version aka `hardwareVersion`
        "01", //         language id length
        "00", //         language id
        "01", // ?
        "00", // ?
        "9000", //       status
      ].join(""),
      "hex",
    );

    const expectedParseResult = {
      isBootloader: false,
      rawVersion: "0.0.0", // Defaults to "0.0.0" for old firmware
      targetId: 855638020,
      seVersion: "0.0.0",
      mcuVersion: "2.30",
      mcuBlVersion: undefined,
      mcuTargetId: undefined,
      seTargetId: 855638020,
      flags: Buffer.from([]), // Expected to be an empty buffer
      bootloaderVersion: undefined, // because seVersion is "0.0.0" so isBootloaderVersionSupported will return false
      hardwareVersion: undefined, // because seVersion is "0.0.0" so isDeviceVersionSupported will return false
      languageId: undefined, // because seVersion is "0.0.0" so isDeviceLocalizationSupported will return false
    };

    const parseResult = parseGetVersionResponse(responseBuffer);

    expect(parseResult).toEqual(expectedParseResult);
  });

  it("correctly parses buffer for a bootloader version", () => {
    const responseBuffer = Buffer.from(
      [
        "05010003", //  targetId, also mcuTargetId
        "04", //        rawVersion length
        "312e3136", //  rawVersion, also mcuBlVersion
        "04", //        flags length
        "f4d8aa43", //  flags
        "05", //        seVersion length
        "322e322e33", //seVersion
        "04", //        seTargetId length
        "33000004", //  seTargetId
        "9000", //      status
      ].join(""),
      "hex",
    );

    const expectedParseResult = {
      isBootloader: true,
      rawVersion: "1.16",
      targetId: 83951619,
      seVersion: "2.2.3",
      mcuVersion: "",
      mcuBlVersion: "1.16",
      mcuTargetId: 83951619,
      seTargetId: 855638020,
      flags: Buffer.from([244, 216, 170, 67]),
      bootloaderVersion: undefined,
      hardwareVersion: undefined,
      languageId: undefined,
    };

    const parseResult = parseGetVersionResponse(responseBuffer);

    expect(parseResult).toEqual(expectedParseResult);
  });
});
