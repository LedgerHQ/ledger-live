import {
  DeviceActionStatus,
  DeviceModelId,
  DeviceSessionState,
  DeviceSessionStateType,
  DeviceStatus,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";

import { makeDeviceActionInternalApiMock } from "../__test-utils__/makeInternalApi";
import { setupGoToDashboardMock } from "../__test-utils__/setupTestMachine";
import { testDeviceActionStates } from "../__test-utils__/testDeviceActionStates";

import { PrepareConnectManagerDeviceAction } from "./PrepareConnectManagerDeviceAction";
import type { PrepareConnectManagerDAState } from "./types";

jest.mock("@ledgerhq/device-management-kit", () => {
  const original = jest.requireActual<typeof import("@ledgerhq/device-management-kit")>(
    "@ledgerhq/device-management-kit",
  );
  return {
    ...original,
    GoToDashboardDeviceAction: jest.fn(() => ({
      makeStateMachine: jest.fn(),
    })),
  };
});

describe("PrepareConnectManagerDeviceAction", () => {
  const apiMock = makeDeviceActionInternalApiMock();

  beforeEach(() => {
    jest.clearAllMocks();
    apiMock.getDeviceSessionState.mockReturnValue({
      sessionStateType: DeviceSessionStateType.ReadyWithoutSecureChannel,
      deviceStatus: DeviceStatus.CONNECTED,
      deviceModelId: DeviceModelId.NANO_X,
    } as DeviceSessionState);
  });

  describe("success cases", () => {
    it("Prepare manager success", () =>
      new Promise<void>((resolve, reject) => {
        setupGoToDashboardMock();
        const deviceAction = new PrepareConnectManagerDeviceAction({ input: {} });

        const expectedStates: Array<PrepareConnectManagerDAState> = [
          // GoToDashboard
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
            },
            status: DeviceActionStatus.Pending,
          },
          // Success
          {
            output: undefined,
            status: DeviceActionStatus.Completed,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));
  });

  describe("error cases", () => {
    it("GoToDashboard error", () =>
      new Promise<void>((resolve, reject) => {
        setupGoToDashboardMock(true);

        const deviceAction = new PrepareConnectManagerDeviceAction({ input: {} });

        const expectedStates: Array<PrepareConnectManagerDAState> = [
          // GoToDashboard
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
            },
            status: DeviceActionStatus.Pending,
          },
          // Error is ignored
          {
            output: undefined,
            status: DeviceActionStatus.Completed,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));
  });
});
