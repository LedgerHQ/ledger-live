import React from "react";
import { Pressable, View } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { ChecksScreenProps, ChecksScreenState } from "LLM/features/DeviceOnboarding/types";
import { ChecksScreen } from "./index";

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

function mockQueuedBottomSheet({
  children,
  isRequestingToBeOpened,
  onClose,
  testID = "queued-bottom-sheet",
}: {
  children: React.ReactNode;
  isRequestingToBeOpened?: boolean;
  onClose?: () => void;
  testID?: string;
}) {
  if (!isRequestingToBeOpened) return null;
  return (
    <View testID={testID}>
      {onClose ? <Pressable testID={`${testID}-dismiss`} onPress={onClose} /> : null}
      {children}
    </View>
  );
}

jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  return {
    ...actual,
    QueuedBottomSheet: mockQueuedBottomSheet,
  };
});

const device = {
  deviceId: "device-id",
  modelId: DeviceModelId.stax,
  wired: false,
};

function renderChecks(state: ChecksScreenState) {
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
  it("should start the check from the idle call to action", async () => {
    const { user, onStart, onContinue } = renderChecks("idle");

    expect(
      screen.getByText(
        "We'll confirm this device is genuine and that its operating system is up to date.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("Allow the secure connection")).toBeNull();

    await user.press(screen.getByRole("button", { name: "Check my device" }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("should leave the flow from the header while the check is running", async () => {
    const { user, onQuit, onStart, onContinue } = renderChecks("checking");

    expect(screen.getByText("Checking your device")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Check my device" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();

    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("should close the allow prompt without leaving the check", async () => {
    const { user, onCloseSheet, onQuit, onStart } = renderChecks("awaitingAllow");

    expect(screen.getByText("Checking your device")).toBeVisible();
    expect(screen.getByText("Allow the secure connection")).toBeVisible();
    expect(screen.getByText("Confirm on your device to continue the check.")).toBeVisible();

    await user.press(screen.getByTestId(`${checksTestIds.allowSheet}-dismiss`));

    expect(onCloseSheet).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();

    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });

  it("should continue only after the device is genuine and up to date", async () => {
    const { user, onContinue, onStart } = renderChecks("succeeded");

    expect(screen.getByText("Your device is genuine and up to date")).toBeVisible();

    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });

  it("should expose no pressable control while the operating system is updating", () => {
    const { onQuit, onStart, onContinue, onCloseSheet } = renderChecks("updating");

    expect(screen.getByText("Updating your device")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
    expect(onQuit).not.toHaveBeenCalled();
    expect(onStart).not.toHaveBeenCalled();
    expect(onContinue).not.toHaveBeenCalled();
    expect(onCloseSheet).not.toHaveBeenCalled();
  });
});
