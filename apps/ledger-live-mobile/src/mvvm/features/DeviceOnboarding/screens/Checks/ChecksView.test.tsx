import React from "react";
import { Platform } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { ChecksScreenProps, ChecksScreenState } from "LLM/features/DeviceOnboarding/types";
import { ChecksScreen } from "./index";

jest.mock("LLM/components/QueuedDrawer", () => {
  const { Pressable, Text, View } = jest.requireActual("react-native");

  return function QueuedDrawerMock({
    isRequestingToBeOpened,
    onClose,
    noCloseButton,
    children,
  }: {
    isRequestingToBeOpened?: boolean;
    onClose?: () => void;
    noCloseButton?: boolean;
    children?: React.ReactNode;
  }) {
    if (!isRequestingToBeOpened) return null;

    return (
      <View>
        {!noCloseButton && onClose ? (
          <Pressable testID="modal-close-button" onPress={onClose}>
            <Text>Close drawer</Text>
          </Pressable>
        ) : null}
        {children}
      </View>
    );
  };
});

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  const RN = jest.requireActual("react-native");

  return {
    ...actual,
    BottomSheetHeader: ({ title }: { title?: string }) =>
      title ? <RN.Text>{title}</RN.Text> : null,
    BottomSheetView: ({ children, testID }: { children?: React.ReactNode; testID?: string }) => (
      <RN.View testID={testID}>{children}</RN.View>
    ),
  };
});

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  ...jest.requireActual("@shared/ui-queued-bottom-sheet"),
  QueuedBottomSheet: jest.requireActual("@shared/ui-queued-bottom-sheet/testing/module-mock")
    .QueuedBottomSheet,
}));

const device = {
  deviceId: "device-id",
  deviceName: "Lily's Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

const nanoX = {
  ...device,
  deviceName: "Nano X",
  modelId: DeviceModelId.nanoX,
  wired: false,
};

function renderChecks(state: ChecksScreenState, overrides: Partial<ChecksScreenProps> = {}) {
  const onStart = jest.fn();
  const onRetry = jest.fn();
  const onAcceptUpdate = jest.fn();
  const onDeclineUpdate = jest.fn();
  const onCloseSheet = jest.fn();
  const onContinue = jest.fn();
  const onQuit = jest.fn();
  const props: ChecksScreenProps = {
    device,
    state,
    error: null,
    update: null,
    onStart,
    onRetry,
    onAcceptUpdate,
    onDeclineUpdate,
    onCloseSheet,
    onContinue,
    onQuit,
    ...overrides,
  };

  return {
    ...render(<ChecksScreen {...props} />),
    onStart,
    onRetry,
    onAcceptUpdate,
    onDeclineUpdate,
    onCloseSheet,
    onContinue,
    onQuit,
  };
}

describe("ChecksView", () => {
  it("should only let the user leave while the device is synchronizing", async () => {
    const { user, onQuit, onStart, onContinue } = renderChecks("synchronizing");

    expect(screen.getByText("Synchronizing...")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Check my device" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();

    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("should start the check from the idle call to action", async () => {
    const { user, onStart, onContinue } = renderChecks("idle");

    expect(
      screen.getByText("Let's confirm that your Ledger device is genuine and up-to-date."),
    ).toBeVisible();
    expect(screen.queryByText("Tap on “Allow” to start Ledger Genuine Check")).toBeNull();

    await user.press(screen.getByRole("button", { name: "Check my device" }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("should leave the flow from the header while the check is running", async () => {
    const { user, onQuit, onStart, onContinue } = renderChecks("checking");

    expect(screen.getByText("Check your device")).toBeVisible();
    expect(
      screen.getByText("Confirming your Ledger signer is safe to use and up-to-date."),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Check my device" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();

    await user.press(screen.getByText("Checking..."));

    expect(onStart).not.toHaveBeenCalled();
    expect(onContinue).not.toHaveBeenCalled();

    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("should close the allow prompt without leaving the check", async () => {
    const { user, onCloseSheet, onQuit, onStart } = renderChecks("awaitingAllow");

    expect(screen.getByText("Check your device")).toBeVisible();
    expect(screen.getByText("Tap on “Allow” to start Ledger Genuine Check")).toBeVisible();
    expect(screen.getByText("Lily's Stax")).toBeVisible();

    expect(screen.queryByTestId(`${checksTestIds.allowSheet}-dismiss`)).toBeNull();

    await user.press(screen.getByTestId(`${checksTestIds.allowSheet}-header-close`));

    expect(onCloseSheet).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();

    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });

  it("should continue only after the device is genuine and up to date", async () => {
    const { user, onContinue, onStart } = renderChecks("succeeded");

    expect(screen.getByText("Device genuine and up-to-date")).toBeVisible();

    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });

  it("should show the available OS version while an update is offered", () => {
    renderChecks("updating", { update: { current: "1.0.0", available: "1.1.0" } });

    expect(screen.getByText(/Version 1\.1\.0/)).toBeVisible();
    expect(screen.getByText(/Ledger\s+Stax OS update available/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("should decline the update once when the offer is closed", async () => {
    const { user, onDeclineUpdate, onCloseSheet, onQuit, onAcceptUpdate } = renderChecks(
      "updating",
      { update: { current: "1.0.0", available: "1.1.0" } },
    );

    await user.press(screen.getByTestId("modal-close-button"));
    await user.press(screen.getByTestId("modal-close-button"));

    expect(onDeclineUpdate).toHaveBeenCalledTimes(1);
    expect(onCloseSheet).not.toHaveBeenCalled();
    expect(onQuit).not.toHaveBeenCalled();
    expect(onAcceptUpdate).not.toHaveBeenCalled();
  });

  it("should open the unsupported update drawer for a Nano X on Bluetooth below 2.4.0", async () => {
    const { user, onAcceptUpdate, onDeclineUpdate } = renderChecks("updating", {
      device: nanoX,
      update: { current: "2.3.0", available: "2.5.0" },
    });

    await user.press(screen.getByText("Update now"));

    expect(screen.getByText("Firmware Update")).toBeVisible();
    expect(onAcceptUpdate).not.toHaveBeenCalled();

    await user.press(screen.getByRole("button", { name: "Close" }));
    await user.press(screen.getByText("See what's in the update"));

    expect(screen.getByText("Firmware Update")).toBeVisible();
    expect(onAcceptUpdate).not.toHaveBeenCalled();
    expect(onDeclineUpdate).not.toHaveBeenCalled();
  });

  it("should ask for a USB cable when that Nano X is on Android", async () => {
    const platform = jest.replaceProperty(Platform, "OS", "android");

    try {
      const { user, onAcceptUpdate } = renderChecks("updating", {
        device: nanoX,
        update: { current: "2.3.0", available: "2.5.0" },
      });

      await user.press(screen.getByText("Update now"));

      expect(screen.getByText("USB cable needed")).toBeVisible();
      expect(onAcceptUpdate).not.toHaveBeenCalled();
    } finally {
      platform.restore();
    }
  });

  it("should accept the update from the primary action on a Nano X at 2.4.0", async () => {
    const { user, onAcceptUpdate, onDeclineUpdate } = renderChecks("updating", {
      device: nanoX,
      update: { current: "2.4.0", available: "2.5.0" },
    });

    await user.press(screen.getByText("Update now"));

    expect(onAcceptUpdate).toHaveBeenCalledTimes(1);
    expect(onDeclineUpdate).not.toHaveBeenCalled();
  });

  it("should accept the update from the release notes action on a Nano X at 2.4.0", async () => {
    const { user, onAcceptUpdate, onDeclineUpdate } = renderChecks("updating", {
      device: nanoX,
      update: { current: "2.4.0", available: "2.5.0" },
    });

    await user.press(screen.getByText("See what's in the update"));

    expect(onAcceptUpdate).toHaveBeenCalledTimes(1);
    expect(onDeclineUpdate).not.toHaveBeenCalled();
  });

  it("should still decline the offer after the unsupported update drawer is closed", async () => {
    const { user, onDeclineUpdate, onAcceptUpdate, onQuit } = renderChecks("updating", {
      device: nanoX,
      update: { current: "2.3.0", available: "2.5.0" },
    });

    await user.press(screen.getByText("Update now"));
    await user.press(screen.getByRole("button", { name: "Close" }));
    await user.press(screen.getByTestId("modal-close-button"));

    expect(onDeclineUpdate).toHaveBeenCalledTimes(1);
    expect(onAcceptUpdate).not.toHaveBeenCalled();
    expect(onQuit).not.toHaveBeenCalled();
  });
});
