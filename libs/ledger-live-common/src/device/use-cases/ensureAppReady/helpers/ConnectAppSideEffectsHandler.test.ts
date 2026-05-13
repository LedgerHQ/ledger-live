import { DeviceId } from "@ledgerhq/client-ids/ids";
import type {
  GetDeviceMetadataDAOutput,
  GetOsVersionResponse,
} from "@ledgerhq/device-management-kit";
import {
  DeviceActionStatus,
  DeviceModelId as DmkDeviceModelId,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import type { ConnectAppDAState } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";
import type { ConnectAppInitSideEffects } from "../types";
import {
  buildLastSeenDeviceInfoPayload,
  ConnectAppSideEffectsHandler,
  mapDeviceInfo,
} from "./ConnectAppSideEffectsHandler";

jest.mock("@ledgerhq/live-dmk-shared", () => ({
  dmkToLedgerDeviceIdMap: {
    [DmkDeviceModelId.NANO_X]: LedgerDeviceModelId.nanoX,
  },
}));

const firmwareMetadata = {
  isBootloader: false,
  seVersion: "2.1.0",
  targetId: 1,
  seTargetId: 1,
  mcuSephVersion: "1.0.0",
  mcuTargetId: 1,
  seFlags: Uint8Array.from([0x88]),
  mcuBootloaderVersion: "1.0.0",
  hwVersion: "01",
  langId: 1,
};

type PendingIntermediateValue = Extract<
  ConnectAppDAState,
  { status: DeviceActionStatus.Pending }
>["intermediateValue"] & {
  deviceMetadata?: GetDeviceMetadataDAOutput;
};

function makeDeviceMetadata(
  metadata: typeof firmwareMetadata | undefined,
  firmwareUpdateContext?: unknown,
): GetDeviceMetadataDAOutput {
  return {
    firmwareVersion: {
      os: "2.1.0",
      metadata,
    },
    firmwareUpdateContext,
  } as unknown as GetDeviceMetadataDAOutput;
}

function makeFirmwareUpdateContext() {
  return {
    availableUpdate: {
      osuFirmware: {
        id: 1,
        perso: "osu-perso",
        firmware: "osu-firmware",
        firmwareKey: "osu-firmware-key",
        hash: "",
        nextFinalFirmware: "2.2.0",
      },
      finalFirmware: {
        id: 2,
        version: "2.2.0",
        perso: "final-perso",
        firmware: "",
        firmwareKey: "",
        hash: "",
        bytes: 0,
        mcuVersions: ["1.1.0"],
      },
      mcuUpdateRequired: true,
    },
  };
}

function makePending(overrides: Partial<PendingIntermediateValue> = {}): ConnectAppDAState {
  return {
    status: DeviceActionStatus.Pending,
    intermediateValue: {
      requiredUserInteraction: UserInteractionRequired.None,
      installPlan: null,
      deviceDeprecation: undefined,
      deviceMetadata: undefined,
      ...overrides,
    },
  } as unknown as ConnectAppDAState;
}

function makeCompleted(): ConnectAppDAState {
  return {
    status: DeviceActionStatus.Completed,
    output: {},
  };
}

function createHarness() {
  const sideEffects: jest.Mocked<ConnectAppInitSideEffects> = {
    onDeviceIdObserved: jest.fn(),
    onLastSeenDeviceInfoObserved: jest.fn(),
  };
  const handler = new ConnectAppSideEffectsHandler({
    sideEffects,
    deviceModelId: DmkDeviceModelId.NANO_X,
  });

  return { handler, sideEffects };
}

describe("ConnectAppSideEffectsHandler", () => {
  describe("GIVEN pending snapshots with device ids", () => {
    it("WHEN a device id is observed THEN it emits it once per distinct value", () => {
      // GIVEN
      const { handler, sideEffects } = createHarness();
      const firstDeviceId = Uint8Array.from([1, 2, 3]);
      const secondDeviceId = Uint8Array.from([4, 5, 6]);

      // WHEN
      handler.handleSnapshot(makePending({ deviceId: firstDeviceId }));
      handler.handleSnapshot(makePending({ deviceId: firstDeviceId }));
      handler.handleSnapshot(makePending({ deviceId: secondDeviceId }));

      // THEN
      expect(sideEffects.onDeviceIdObserved).toHaveBeenCalledTimes(2);
      expect(sideEffects.onDeviceIdObserved).toHaveBeenNthCalledWith(
        1,
        DeviceId.fromString("010203"),
      );
      expect(sideEffects.onDeviceIdObserved).toHaveBeenNthCalledWith(
        2,
        DeviceId.fromString("040506"),
      );
    });

    it("WHEN a non-pending or missing-device-id snapshot is handled THEN it does not emit a device id", () => {
      // GIVEN
      const { handler, sideEffects } = createHarness();

      // WHEN
      handler.handleSnapshot(makeCompleted());
      handler.handleSnapshot(makePending());

      // THEN
      expect(sideEffects.onDeviceIdObserved).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN pending snapshots with device metadata", () => {
    it("WHEN valid device metadata is observed THEN it emits last-seen device info", () => {
      // GIVEN
      const { handler, sideEffects } = createHarness();

      // WHEN
      handler.handleSnapshot(
        makePending({
          deviceMetadata: makeDeviceMetadata(firmwareMetadata),
        }),
      );

      // THEN
      expect(sideEffects.onLastSeenDeviceInfoObserved).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: LedgerDeviceModelId.nanoX,
          latestFirmware: null,
          deviceInfo: expect.objectContaining({
            version: "2.1.0",
            seVersion: "2.1.0",
          }),
        }),
      );
    });

    it("WHEN the same device info payload is observed twice THEN it emits it once", () => {
      // GIVEN
      const { handler, sideEffects } = createHarness();
      const deviceMetadata = makeDeviceMetadata(firmwareMetadata);

      // WHEN
      handler.handleSnapshot(makePending({ deviceMetadata }));
      handler.handleSnapshot(makePending({ deviceMetadata }));

      // THEN
      expect(sideEffects.onLastSeenDeviceInfoObserved).toHaveBeenCalledTimes(1);
    });

    it("WHEN firmware update metadata is present THEN it includes the latest firmware payload", () => {
      // GIVEN
      const { handler, sideEffects } = createHarness();

      // WHEN
      handler.handleSnapshot(
        makePending({
          deviceMetadata: makeDeviceMetadata(firmwareMetadata, makeFirmwareUpdateContext()),
        }),
      );

      // THEN
      expect(sideEffects.onLastSeenDeviceInfoObserved).toHaveBeenCalledWith(
        expect.objectContaining({
          latestFirmware: expect.objectContaining({
            shouldFlashMCU: true,
            osu: expect.objectContaining({
              id: 1,
              next_se_firmware_final_version: "2.2.0",
            }),
            final: expect.objectContaining({
              id: 2,
              version: "2.2.0",
              mcu_versions: ["1.1.0"],
            }),
          }),
        }),
      );
    });

    it("WHEN metadata is missing or invalid THEN it does not emit last-seen device info", () => {
      // GIVEN
      const { handler, sideEffects } = createHarness();
      const invalidFirmwareMetadata = {
        ...firmwareMetadata,
        seVersion: "",
      };

      // WHEN
      handler.handleSnapshot(makeCompleted());
      handler.handleSnapshot(makePending());
      handler.handleSnapshot(
        makePending({
          deviceMetadata: makeDeviceMetadata(undefined),
        }),
      );
      handler.handleSnapshot(
        makePending({
          deviceMetadata: makeDeviceMetadata(invalidFirmwareMetadata),
        }),
      );

      // THEN
      expect(sideEffects.onLastSeenDeviceInfoObserved).not.toHaveBeenCalled();
    });
  });
});

describe("mapDeviceInfo", () => {
  it("GIVEN an OS version without an SE version WHEN it is mapped THEN it returns null", () => {
    // GIVEN / WHEN
    const deviceInfo = mapDeviceInfo({
      ...firmwareMetadata,
      seVersion: "",
    } as GetOsVersionResponse);

    // THEN
    expect(deviceInfo).toBeNull();
  });
});

describe("buildLastSeenDeviceInfoPayload", () => {
  it("GIVEN missing device metadata WHEN the payload is built THEN it returns null", () => {
    // GIVEN / WHEN
    const payload = buildLastSeenDeviceInfoPayload({
      deviceMetadata: undefined,
      deviceModelId: DmkDeviceModelId.NANO_X,
    });

    // THEN
    expect(payload).toBeNull();
  });
});
