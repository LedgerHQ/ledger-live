import React from "react";
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
      if (!isRequestingToBeOpened) return undefined;
      return () => {
        onCloseRef.current?.();
      };
    }, [isRequestingToBeOpened]);

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
    onQuit,
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

  it("should move on by itself once the device is genuine and up to date", async () => {
    const { user, onQuit, onStart, onRetry, onCloseSheet, onAcceptUpdate, onDeclineUpdate } =
      renderChecks("succeeded");
    const continueButton = screen.getByRole("button", { name: "Continue" });

    expect(screen.getByText("Device genuine and up-to-date")).toBeVisible();
    expect(within(continueButton).getByLabelText("Loading")).toBeVisible();

    await user.press(continueButton);

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

  it("should offer the existing OS update sheet while the device needs an update", async () => {
    const { user, onAcceptUpdate, onDeclineUpdate, onCloseSheet, onQuit, onStart } =
      renderChecks("updating");

    expect(screen.getByText("Ledger OS update required")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(screen.queryByTestId(`${checksTestIds.updateSheet}-header-close`)).toBeNull();

    await user.press(screen.getByText("Update Ledger OS"));
    await user.press(screen.getByText("Cancel operation"));
    expect(screen.queryByTestId(`${checksTestIds.updateSheet}-dismiss`)).toBeNull();

    expect(onAcceptUpdate).toHaveBeenCalledTimes(1);
    expect(onDeclineUpdate).toHaveBeenCalledTimes(1);
    expect(onCloseSheet).not.toHaveBeenCalled();
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
      const { user, onCloseSheet, onQuit, rerender } = renderChecks("checking", { kind });
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
      kind: "network",
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
      kind: "notGenuine",
    });

    expect(screen.getByText("Check your device")).toBeVisible();
    expect(screen.getByText("This Ledger Stax failed the Ledger Genuine Check")).toBeVisible();
    expect(screen.queryByText("Go to settings")).toBeNull();

    await user.press(screen.getByTestId("modal-close-button"));

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onCloseSheet).not.toHaveBeenCalled();
  });
});
