import type {
  GetAppAndVersionResponse,
  GetDeviceMetadataDAOutput,
} from "@ledgerhq/device-management-kit";
import { BlockingStateType, FinalStateType } from "@ledgerhq/live-dmk-shared";
import { buildFinalState } from "./buildFinalState";

jest.mock("@ledgerhq/live-dmk-shared", () => ({
  BlockingStateType: {
    WrongDeviceForAccount: "wrong-device-for-account",
  },
  FinalStateType: {
    Success: "success",
  },
  buildExtractedContext: jest.fn(({ deviceMetadata, currentApp, derivation }) => ({
    currentOsVersion: deviceMetadata?.firmwareVersion.os ?? "unknown",
    osUpdateAvailable: Boolean(deviceMetadata?.firmwareUpdateContext?.availableUpdate),
    currentAppName: currentApp.name,
    currentAppVersion: currentApp.version,
    derivedAddress: derivation,
  })),
}));

const currentApp: GetAppAndVersionResponse = {
  name: "Ethereum",
  version: "2.0.0",
};

const deviceMetadata = {
  firmwareVersion: {
    os: "2.1.0",
  },
  firmwareUpdateContext: {
    availableUpdate: {},
  },
} as unknown as GetDeviceMetadataDAOutput;

describe("buildFinalState", () => {
  it("GIVEN a matching expected account WHEN the final state is built THEN it returns success", () => {
    // WHEN
    const result = buildFinalState({
      expectedAccount: {
        accountName: "Account 1",
        acceptableDerivedAddresses: ["0xderived"],
      },
      deviceMetadata,
      currentApp,
      derivation: "0xderived",
    });

    // THEN
    expect(result).toEqual({
      type: FinalStateType.Success,
      extractedContext: {
        currentOsVersion: "2.1.0",
        osUpdateAvailable: true,
        currentAppName: "Ethereum",
        currentAppVersion: "2.0.0",
        derivedAddress: "0xderived",
      },
    });
  });

  it("GIVEN a mismatching expected account WHEN the final state is built THEN it returns a wrong-device state", () => {
    // WHEN
    const result = buildFinalState({
      expectedAccount: {
        accountName: "Account 1",
        acceptableDerivedAddresses: ["0xexpected"],
      },
      deviceMetadata,
      currentApp,
      derivation: "0xderived",
    });

    // THEN
    expect(result).toEqual({
      type: BlockingStateType.WrongDeviceForAccount,
      accountName: "Account 1",
    });
  });
});
