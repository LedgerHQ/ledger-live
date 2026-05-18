import type {
  GetAppAndVersionResponse,
  GetDeviceMetadataDAOutput,
} from "@ledgerhq/device-management-kit";
import { DeviceActionStatus, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import type { ConnectAppDAState } from "../ConnectApp/types";
import { ConnectAppCompletionCapturer } from "./ConnectAppCompletionCapturer";

const deviceMetadata = {
  firmwareVersion: {
    os: "2.1.0",
    metadata: {
      isBootloader: false,
      seVersion: "2.1.0",
      targetId: 1,
      seTargetId: 1,
      mcuSephVersion: "1.0.0",
      mcuTargetId: 1,
      seFlags: Uint8Array.from([1, 2, 3]),
      mcuBootloaderVersion: "1.0.0",
      hwVersion: "01",
      langId: 1,
    },
  },
  firmwareUpdateContext: undefined,
} as unknown as GetDeviceMetadataDAOutput;

const currentApp: GetAppAndVersionResponse = {
  name: "Ethereum",
  version: "2.0.0",
};

function makePending(): ConnectAppDAState {
  return {
    status: DeviceActionStatus.Pending,
    intermediateValue: {
      requiredUserInteraction: UserInteractionRequired.None,
      installPlan: null,
      deviceDeprecation: undefined,
      deviceMetadata: undefined,
    },
  } as unknown as ConnectAppDAState;
}

function makeCompleted(params: {
  deviceMetadata?: GetDeviceMetadataDAOutput;
  derivation?: string;
  currentApp?: GetAppAndVersionResponse;
}): ConnectAppDAState {
  return {
    status: DeviceActionStatus.Completed,
    output: params,
  };
}

describe("ConnectAppCompletionCapturer", () => {
  describe("GIVEN no completed snapshot has been handled", () => {
    it("WHEN the capture is requested THEN it returns null", () => {
      // GIVEN
      const capturer = new ConnectAppCompletionCapturer();

      // WHEN
      const capture = capturer.getCompletionCapture();

      // THEN
      expect(capture).toBeNull();
    });
  });

  describe("GIVEN a non-completed snapshot is handled", () => {
    it("WHEN the capture is requested THEN it is ignored", () => {
      // GIVEN
      const capturer = new ConnectAppCompletionCapturer();

      // WHEN
      capturer.handleSnapshot(makePending());

      // THEN
      expect(capturer.getCompletionCapture()).toBeNull();
    });
  });

  describe("GIVEN a completed snapshot is handled", () => {
    it("WHEN the capture is requested THEN it returns the completion output", () => {
      // GIVEN
      const capturer = new ConnectAppCompletionCapturer();

      // WHEN
      capturer.handleSnapshot(
        makeCompleted({
          deviceMetadata,
          derivation: "0xderived",
        }),
      );

      // THEN
      expect(capturer.getCompletionCapture()).toEqual({
        deviceMetadata,
        derivation: "0xderived",
        currentApp: undefined,
      });
    });

    it("WHEN a completed snapshot includes the current app THEN it captures it", () => {
      // GIVEN
      const capturer = new ConnectAppCompletionCapturer();

      // WHEN
      capturer.handleSnapshot(
        makeCompleted({
          deviceMetadata,
          derivation: "0xderived",
          currentApp,
        }),
      );

      // THEN
      expect(capturer.getCompletionCapture()).toEqual({
        deviceMetadata,
        derivation: "0xderived",
        currentApp,
      });
    });

    it("WHEN another completed snapshot is handled THEN it keeps the latest completion output", () => {
      // GIVEN
      const capturer = new ConnectAppCompletionCapturer();
      capturer.handleSnapshot(
        makeCompleted({
          deviceMetadata,
          derivation: "0xfirst",
        }),
      );

      // WHEN
      capturer.handleSnapshot(
        makeCompleted({
          deviceMetadata: undefined,
          derivation: "0xsecond",
        }),
      );

      // THEN
      expect(capturer.getCompletionCapture()).toEqual({
        deviceMetadata: undefined,
        derivation: "0xsecond",
        currentApp: undefined,
      });
    });
  });
});
