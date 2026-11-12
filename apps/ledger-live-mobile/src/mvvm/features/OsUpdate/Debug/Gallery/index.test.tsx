import React from "react";
import {
  ApplyUpdatesStateType,
  CreateBackupStateType,
  OsUpdatesSteps,
  PreChecksStateType,
  RestoreBackupStateType,
} from "@features/platform-device-os-update";
import { RestoreStatus } from "@domain/entity-device-os-update";
import { render, screen } from "@tests/test-renderer";
import { previewGroups } from "./previews";
import { progressPresets, updateCounts } from "./fixtures";
import OsUpdateGallery from "./index";

// The gallery previews the flow without a device: any DMK instance does.
jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-mobile"),
  useDeviceManagementKit: () => ({ listConnectedDevices: () => [] }),
}));

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack }),
}));

const stateTypesByStep = {
  [OsUpdatesSteps.PRE_CHECKS]: Object.values(PreChecksStateType),
  [OsUpdatesSteps.CREATE_BACKUP]: Object.values(CreateBackupStateType),
  [OsUpdatesSteps.APPLY_UPDATES]: Object.values(ApplyUpdatesStateType),
  [OsUpdatesSteps.RESTORE_BACKUP]: Object.values(RestoreBackupStateType),
};

const previewedStates = new Set(
  previewGroups.flatMap(group =>
    group.previews.flatMap(preview =>
      preview.kind === "step"
        ? updateCounts
            .flatMap(updateCount =>
              progressPresets.map(progress => {
                const { step, state } = preview.build({ updateCount, progress });
                const restoreStatus =
                  "restoreResult" in state ? state.restoreResult?.restoreStatus : undefined;
                return [`${step}.${state.type}`, `${step}.${state.type}.${restoreStatus}`];
              }),
            )
            .flat()
        : [],
    ),
  ),
);

describe("OsUpdateGallery", () => {
  it.each(
    Object.entries(stateTypesByStep).flatMap(([step, types]) =>
      types.map(type => `${step}.${type}`),
    ),
  )("should preview the %s state", stepState => {
    expect(previewedStates).toContain(stepState);
  });

  it.each(
    [
      `${OsUpdatesSteps.APPLY_UPDATES}.${ApplyUpdatesStateType.UPDATES_APPLIED}`,
      `${OsUpdatesSteps.RESTORE_BACKUP}.${RestoreBackupStateType.BACKUP_RESTORED}`,
    ].flatMap(success => Object.values(RestoreStatus).map(status => `${success}.${status}`)),
  )("should preview the %s success", success => {
    expect(previewedStates).toContain(success);
  });

  it("should tell on the success screen that the device ran out of memory", async () => {
    const { user } = render(<OsUpdateGallery />);

    await user.press(screen.getByRole("button", { name: "100%" }));
    await user.press(screen.getAllByRole("button", { name: "Success: out of memory" })[0]);

    expect(screen.getByTestId("os-update-applied-screen")).toBeVisible();
    expect(screen.getByTestId("os-update-restore-banner")).toHaveTextContent(/Not enough storage/);
  });

  it("should show the preparing screen with the device locked sheet", async () => {
    const { user } = render(<OsUpdateGallery />);

    await user.press(screen.getAllByRole("button", { name: "Device locked" })[0]);

    expect(screen.getByTestId("os-update-preparing-screen")).toBeVisible();
  });

  it("should only show the update index with several updates", async () => {
    const { user } = render(<OsUpdateGallery />);

    await user.press(screen.getByRole("button", { name: "Updating" }));
    expect(screen.getByTestId("os-update-progress-screen")).toBeVisible();
    expect(screen.queryByText("Update 1/1")).toBeNull();

    await user.press(screen.getByTestId("os-update-close-button"));
    await user.press(screen.getByRole("button", { name: "3 updates" }));
    await user.press(screen.getByRole("button", { name: "Updating" }));

    expect(screen.getByText("Update 2/3")).toBeVisible();
  });

  it("should leave the gallery from the list back button", async () => {
    const { user } = render(<OsUpdateGallery />);

    await user.press(screen.getByRole("button", { name: "Back" }));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
