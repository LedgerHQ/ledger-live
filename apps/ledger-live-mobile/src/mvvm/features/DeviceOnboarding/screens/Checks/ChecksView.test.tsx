import React from "react";
import { Platform } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen, within } from "@tests/test-renderer";
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
    const onCloseRef = React.useRef(onClose);
    onCloseRef.current = onClose;
    React.useEffect(() => {
      return () => {
        onCloseRef.current?.();
      };
    }, []);

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
    onQuit,
    ...overrides,
  };
  const view = render(<ChecksScreen {...props} />);

  return {
    ...view,
    onStart,
    onRetry,
    onAcceptUpdate,
    onDeclineUpdate,
    onCloseSheet,
    onQuit,
    rerender(next: Partial<ChecksScreenProps> = {}) {
      Object.assign(props, next);
      view.rerender(<ChecksScreen {...props} />);
    },
  };
}

describe("ChecksView", () => {
  it("should only let the user leave while the device is synchronizing", async () => {
    const { user, onQuit, onStart } = renderChecks("synchronizing");

    expect(screen.getByText("Synchronizing...")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Check my device" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();

    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });

  it("should start the check from the idle call to action", async () => {
    const { user, onStart } = renderChecks("idle");

    expect(
      screen.getByText("Let's confirm that your Ledger device is genuine and up-to-date."),
    ).toBeVisible();
    expect(screen.queryByText("Tap on “Allow” to start Ledger Genuine Check")).toBeNull();

    await user.press(screen.getByRole("button", { name: "Check my device" }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("should leave the flow from the header while the check is running", async () => {
    const { user, onQuit, onStart } = renderChecks("checking");

    expect(screen.getByText("Check your device")).toBeVisible();
    expect(
      screen.getByText("Confirming your Ledger signer is safe to use and up-to-date."),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Check my device" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();

    await user.press(screen.getByText("Checking..."));

    expect(onStart).not.toHaveBeenCalled();

    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });

  it("should quit from the allow sheet while approval is pending", async () => {
    const { user, onCloseSheet, onQuit, onStart } = renderChecks("awaitingAllow");

    expect(screen.getByText("Check your device")).toBeVisible();
    expect(screen.getByText("Tap on “Allow” to start Ledger Genuine Check")).toBeVisible();
    expect(screen.getByText("Lily's Stax")).toBeVisible();
    expect(screen.queryByTestId(`${checksTestIds.allowSheet}-dismiss`)).toBeNull();

    await user.press(screen.getByTestId(`${checksTestIds.allowSheet}-header-close`));

    expect(onCloseSheet).not.toHaveBeenCalled();
    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });

  it("should keep continue waiting while the success screen cannot be left yet", () => {
    renderChecks("succeeded");
    const continueButton = screen.getByRole("button", { name: "Continue" });

    expect(screen.getByText("Device genuine and up-to-date")).toBeVisible();
    expect(within(continueButton).getByLabelText("Loading")).toBeVisible();
  });

  it("should continue when the user leaves the success screen", async () => {
    const onContinue = jest.fn();
    const { user, onQuit, onStart, onRetry, onCloseSheet, onAcceptUpdate, onDeclineUpdate } =
      renderChecks("succeeded", { onContinue });
    const continueButton = screen.getByRole("button", { name: "Continue" });

    expect(screen.getByText("Device genuine and up-to-date")).toBeVisible();
    expect(within(continueButton).queryByLabelText("Loading")).toBeNull();

    await user.press(continueButton);

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
    expect(onRetry).not.toHaveBeenCalled();
    expect(onCloseSheet).not.toHaveBeenCalled();
    expect(onAcceptUpdate).not.toHaveBeenCalled();
    expect(onDeclineUpdate).not.toHaveBeenCalled();
    expect(onQuit).not.toHaveBeenCalled();
  });

  it("should hide the close button while the onboarding cannot be left", () => {
    const { rerender } = renderChecks("checking");
    expect(screen.getByRole("button", { name: "Close" })).toBeVisible();

    rerender({ onQuit: undefined });

    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
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
    expect(screen.queryByText("Update now")).toBeNull();
    expect(onAcceptUpdate).not.toHaveBeenCalled();
    expect(onDeclineUpdate).not.toHaveBeenCalled();

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
    const { user, onAcceptUpdate, onDeclineUpdate, rerender } = renderChecks("updating", {
      device: nanoX,
      update: { current: "2.4.0", available: "2.5.0" },
    });
    onAcceptUpdate.mockImplementation(() => {
      rerender({ update: null, state: "checking" });
    });

    await user.press(screen.getByText("Update now"));

    expect(onAcceptUpdate).toHaveBeenCalledTimes(1);
    expect(onDeclineUpdate).not.toHaveBeenCalled();
    expect(screen.queryByText("Update now")).toBeNull();

    rerender({ update: { current: "2.4.0", available: "2.5.0" }, state: "updating" });
    await user.press(screen.getByTestId("modal-close-button"));

    expect(onDeclineUpdate).toHaveBeenCalledTimes(1);
  });

  it("should accept the update from the release notes action on a Nano X at 2.4.0", async () => {
    const { user, onAcceptUpdate, onDeclineUpdate, rerender } = renderChecks("updating", {
      device: nanoX,
      update: { current: "2.4.0", available: "2.5.0" },
    });
    onAcceptUpdate.mockImplementation(() => {
      rerender({ update: null, state: "checking" });
    });

    await user.press(screen.getByText("See what's in the update"));

    expect(onAcceptUpdate).toHaveBeenCalledTimes(1);
    expect(onDeclineUpdate).not.toHaveBeenCalled();
    expect(screen.queryByText("See what's in the update")).toBeNull();
  });

  it("should still decline the offer after the unsupported update drawer is closed", async () => {
    const { user, onDeclineUpdate, onAcceptUpdate, onQuit } = renderChecks("updating", {
      device: nanoX,
      update: { current: "2.3.0", available: "2.5.0" },
    });

    await user.press(screen.getByText("Update now"));
    expect(onDeclineUpdate).not.toHaveBeenCalled();

    await user.press(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByText("Update now")).toBeVisible();

    await user.press(screen.getByTestId("modal-close-button"));

    expect(onDeclineUpdate).toHaveBeenCalledTimes(1);
    expect(onAcceptUpdate).not.toHaveBeenCalled();
    expect(onQuit).not.toHaveBeenCalled();
  });

  it.each<{ kind: GenuineErrorKind; title: string; showsSettings: boolean }>([
    { kind: "declined", title: "Ledger Genuine Check error", showsSettings: false },
    { kind: "network", title: "Ledger Genuine Check error", showsSettings: false },
    { kind: "unknown", title: "Ledger Genuine Check error", showsSettings: false },
    { kind: "provider", title: "Initiate Ledger Genuine Check again", showsSettings: true },
  ])(
    "should open the $kind drawer over the current check",
    async ({ kind, title, showsSettings }) => {
      const { user, onCloseSheet, onQuit, rerender } = renderChecks("checking", {
        error: { kind },
      });
      onCloseSheet.mockImplementation(() => {
        rerender({ error: null });
      });

      expect(screen.getByText("Check your device")).toBeVisible();
      expect(screen.getByText(title)).toBeVisible();
      expect(screen.queryByText("Go to settings") !== null).toBe(showsSettings);

      await user.press(screen.getByText("Cancel set up"));

      expect(onCloseSheet).toHaveBeenCalledTimes(1);
      expect(onQuit).not.toHaveBeenCalled();
    },
  );

  it("should retry the genuine check from the error drawer", async () => {
    const { user, onRetry, onCloseSheet, onQuit, rerender } = renderChecks("checking", {
      error: { kind: "network" },
    });
    onRetry.mockImplementation(() => {
      rerender({ error: null });
    });

    await user.press(screen.getByText("Try again"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onCloseSheet).not.toHaveBeenCalled();
    expect(screen.queryByText("Try again")).toBeNull();
    expect(onQuit).not.toHaveBeenCalled();
  });

  it("should leave onboarding when closing the non genuine drawer", async () => {
    const { user, onCloseSheet, onQuit } = renderChecks("checking", {
      error: { kind: "notGenuine" },
    });

    expect(screen.getByText("Check your device")).toBeVisible();
    expect(screen.getByText("This Ledger Stax failed the Ledger Genuine Check")).toBeVisible();
    expect(screen.queryByText("Go to settings")).toBeNull();

    await user.press(screen.getByTestId("modal-close-button"));

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onCloseSheet).not.toHaveBeenCalled();
  });
});
