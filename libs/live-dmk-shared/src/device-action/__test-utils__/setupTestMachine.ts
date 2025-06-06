import {
  GetDeviceMetadataDeviceAction,
  GetDeviceMetadataDAOutput,
  GetDeviceStatusDeviceAction,
  GetDeviceStatusDAOutput,
  GoToDashboardDeviceAction,
  InstallOrUpdateAppsDeviceAction,
  InstallOrUpdateAppsDAIntermediateValue,
  InstallOrUpdateAppsDAOutput,
  OpenAppWithDependenciesDeviceAction,
  OpenAppWithDependenciesDAError,
  OpenAppWithDependenciesDAOutput,
  OpenAppWithDependenciesDAIntermediateValue,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { Left, Right } from "purify-ts";
import type { Mock } from "vitest";
import { assign, createMachine } from "xstate";

export const setupGoToDashboardMock = (error: boolean = false) => {
  (GoToDashboardDeviceAction as Mock).mockImplementation(() => ({
    makeStateMachine: vi.fn().mockImplementation(() =>
      createMachine({
        id: "MockGoToDashboardDeviceAction",
        initial: "ready",
        states: {
          ready: {
            after: {
              0: "done",
            },
            entry: assign({
              intermediateValue: () => ({
                requiredUserInteraction: UserInteractionRequired.None,
              }),
            }),
          },
          done: {
            type: "final",
          },
        },
        output: () => {
          return error ? Left(new UnknownDAError("GoToDashboard failed")) : Right(undefined);
        },
      }),
    ),
  }));
};

export const setupGetDeviceStatusMock = (metadata: GetDeviceStatusDAOutput, error = false) => {
  (GetDeviceStatusDeviceAction as Mock).mockImplementation(() => ({
    makeStateMachine: vi.fn().mockImplementation(() =>
      createMachine({
        id: "MockGetDeviceStatusDeviceAction",
        initial: "ready",
        states: {
          ready: {
            after: {
              0: "done",
            },
            entry: assign({
              intermediateValue: () => ({
                requiredUserInteraction: UserInteractionRequired.None,
              }),
            }),
          },
          done: {
            type: "final",
          },
        },
        output: () => {
          return error ? Left(new UnknownDAError("GetDeviceStatus failed")) : Right(metadata);
        },
      }),
    ),
  }));
};

export const setupGetDeviceMetadataMock = (metadata: GetDeviceMetadataDAOutput, error = false) => {
  (GetDeviceMetadataDeviceAction as Mock).mockImplementation(() => ({
    makeStateMachine: vi.fn().mockImplementation(() =>
      createMachine({
        id: "MockGetDeviceMetadataDeviceAction",
        initial: "ready",
        states: {
          ready: {
            after: {
              0: "done",
            },
            entry: assign({
              intermediateValue: () => ({
                requiredUserInteraction: UserInteractionRequired.None,
              }),
            }),
          },
          done: {
            type: "final",
          },
        },
        output: () => {
          return error ? Left(new UnknownDAError("GetDeviceMetadata failed")) : Right(metadata);
        },
      }),
    ),
  }));
};

export const setupOpenAppWithDependenciesMock = (
  result: OpenAppWithDependenciesDAOutput,
  intermediateValue: OpenAppWithDependenciesDAIntermediateValue,
  error: OpenAppWithDependenciesDAError | undefined = undefined,
) => {
  (OpenAppWithDependenciesDeviceAction as Mock).mockImplementation(() => ({
    makeStateMachine: vi.fn().mockImplementation(() =>
      createMachine({
        id: "MockOpenAppWithDependenciesDeviceAction",
        initial: "ready",
        states: {
          ready: {
            after: {
              0: "done",
            },
            entry: assign({
              intermediateValue: () => intermediateValue,
            }),
          },
          done: {
            type: "final",
          },
        },
        output: () => {
          return error ? Left(error) : Right(result);
        },
      }),
    ),
  }));
};

export const setupInstallOrUpdateAppsMock = (
  result: InstallOrUpdateAppsDAOutput,
  intermediateValue: InstallOrUpdateAppsDAIntermediateValue,
  error = false,
) => {
  (InstallOrUpdateAppsDeviceAction as Mock).mockImplementation(() => ({
    makeStateMachine: vi.fn().mockImplementation(() =>
      createMachine({
        id: "MockInstallOrUpdateAppsDeviceAction",
        initial: "ready",
        states: {
          ready: {
            after: {
              0: "done",
            },
            entry: assign({
              intermediateValue: () => intermediateValue,
            }),
          },
          done: {
            type: "final",
          },
        },
        output: () => {
          return error ? Left(new UnknownDAError("InstallOrUpdateApps failed")) : Right(result);
        },
      }),
    ),
  }));
};
