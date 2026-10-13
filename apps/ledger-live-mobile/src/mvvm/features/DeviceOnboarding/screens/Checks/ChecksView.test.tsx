import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type {
  ChecksScreenProps,
  ChecksScreenState,
  GenuineErrorKind,
} from "LLM/features/DeviceOnboarding/types";
import { ChecksScreen } from "./index";

jest.mock("~/components/QueuedDrawer", () => {
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

function renderChecks(state: ChecksScreenState, error: ChecksScreenProps["error"] = null) {
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
    error,
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

  it("should offer the existing OS update sheet while the device needs an update", async () => {
    const { user, onAcceptUpdate, onDeclineUpdate, onCloseSheet, onQuit, onStart } =
      renderChecks("updating");

    expect(screen.getByText("Ledger OS update required")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();

    await user.press(screen.getByText("Update Ledger OS"));
    await user.press(screen.getByText("Cancel operation"));
    expect(screen.queryByTestId(`${checksTestIds.updateSheet}-dismiss`)).toBeNull();

    await user.press(screen.getByTestId(`${checksTestIds.updateSheet}-header-close`));

    expect(onAcceptUpdate).toHaveBeenCalledTimes(1);
    expect(onDeclineUpdate).toHaveBeenCalledTimes(1);
    expect(onCloseSheet).toHaveBeenCalledTimes(1);
    expect(onQuit).not.toHaveBeenCalled();
    expect(onStart).not.toHaveBeenCalled();
  });

  it.each<{ kind: GenuineErrorKind; title: string; showsSettings: boolean }>([
    { kind: "declined", title: "Ledger Genuine Check error", showsSettings: false },
    { kind: "network", title: "Ledger Genuine Check error", showsSettings: false },
    { kind: "unknown", title: "Ledger Genuine Check error", showsSettings: false },
    { kind: "provider", title: "Initiate Ledger Genuine Check again", showsSettings: true },
  ])(
    "should open the $kind drawer over the current check",
    async ({ kind, title, showsSettings }) => {
      const { user, onCloseSheet, onQuit } = renderChecks("checking", { kind });

      expect(screen.getByText("Check your device")).toBeVisible();
      expect(screen.getByText(title)).toBeVisible();
      expect(screen.queryByText("Go to settings") !== null).toBe(showsSettings);

      await user.press(screen.getByText("Cancel set up"));

      expect(onCloseSheet).toHaveBeenCalledTimes(1);
      expect(onQuit).not.toHaveBeenCalled();
    },
  );

  it("should retry the genuine check from the error drawer", async () => {
    const { user, onRetry, onQuit } = renderChecks("checking", { kind: "network" });

    await user.press(screen.getByText("Try again"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onQuit).not.toHaveBeenCalled();
  });

  it("should close the non genuine drawer without leaving onboarding", async () => {
    const { user, onCloseSheet, onQuit } = renderChecks("checking", { kind: "notGenuine" });

    expect(screen.getByText("Check your device")).toBeVisible();
    expect(screen.getByText("This Ledger Stax failed the Ledger Genuine Check")).toBeVisible();
    expect(screen.queryByText("Go to settings")).toBeNull();

    await user.press(screen.getByTestId("modal-close-button"));

    expect(onCloseSheet).toHaveBeenCalledTimes(1);
    expect(onQuit).not.toHaveBeenCalled();
  });
});
