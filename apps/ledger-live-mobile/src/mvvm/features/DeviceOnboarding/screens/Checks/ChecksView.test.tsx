import React from "react";
import { Linking, Platform } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "@shared/analytics";
import { TrackScreen } from "@shared/analytics-react";
import { render, screen, within } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";

import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type {
  ChecksScreenProps,
  ChecksScreenState,
  GenuineErrorKind,
} from "LLM/features/DeviceOnboarding/types";
import { ChecksScreen } from "./index";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const errorSheetIds: Record<GenuineErrorKind, string> = {
  declined: checksTestIds.declinedSheet,
  network: checksTestIds.networkSheet,
  unknown: checksTestIds.unknownSheet,
  provider: checksTestIds.providerSheet,
  notGenuine: checksTestIds.notGenuineSheet,
};

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
    const requestingRef = React.useRef(isRequestingToBeOpened);
    React.useEffect(() => {
      if (requestingRef.current && !isRequestingToBeOpened) onCloseRef.current?.();
      requestingRef.current = isRequestingToBeOpened;
    }, [isRequestingToBeOpened]);
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

jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { QueuedBottomSheet: QueuedBottomSheetMock } = jest.requireActual(
    "@shared/ui-queued-bottom-sheet/testing/module-mock",
  );

  function QueuedBottomSheet(props: React.ComponentProps<typeof QueuedBottomSheetMock>) {
    const onCloseRef = React.useRef(props.onClose);
    const requestingRef = React.useRef(props.isRequestingToBeOpened);

    React.useEffect(() => {
      onCloseRef.current = props.onClose;
      requestingRef.current = props.isRequestingToBeOpened;
    }, [props.onClose, props.isRequestingToBeOpened]);
    React.useEffect(
      () => () => {
        if (requestingRef.current) onCloseRef.current?.();
      },
      [],
    );

    const isOpen = Boolean(props.isRequestingToBeOpened || props.isForcingToBeOpened);
    return (
      <QueuedBottomSheetMock {...props}>{isOpen ? props.children : null}</QueuedBottomSheetMock>
    );
  }

  return {
    ...jest.requireActual("@shared/ui-queued-bottom-sheet"),
    QueuedBottomSheet,
  };
});

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
    firmwareUpToDate: true,
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
    expect(screen.queryByText("Continue on your Ledger Stax")).toBeNull();

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
    expect(screen.getByText("Continue on your Ledger Stax")).toBeVisible();
    expect(
      screen.getByText(/Follow the instructions displayed on your Secure.Screen/),
    ).toBeVisible();
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

  it("should not claim the device is up to date when the firmware is not", () => {
    renderChecks("succeeded", { firmwareUpToDate: false });

    expect(screen.getByText("Device genuine")).toBeVisible();
    expect(screen.queryByText("Device genuine and up-to-date")).toBeNull();
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

  it("should hide the firmware offer while sheets are suspended", () => {
    const { onDeclineUpdate, rerender } = renderChecks("updating", {
      update: { current: "1.0.0", available: "1.1.0" },
    });

    rerender({ suspendSheets: true });

    expect(onDeclineUpdate).not.toHaveBeenCalled();
    expect(screen.queryByText(/Version 1\.1\.0/)).toBeNull();

    rerender({ suspendSheets: false });

    expect(screen.getByText(/Version 1\.1\.0/)).toBeVisible();
    expect(onDeclineUpdate).not.toHaveBeenCalled();
  });

  it("should reveal the install and skip actions when the offer drawer is closed, without declining", async () => {
    const { user, onAcceptUpdate, onDeclineUpdate, onCloseSheet, onQuit } = renderChecks(
      "updating",
      { update: { current: "1.0.0", available: "1.1.0" } },
    );

    await user.press(screen.getByTestId("modal-close-button"));

    expect(screen.getByRole("button", { name: "Install Ledger OS update" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Skip Ledger OS update" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Close" })).toBeVisible();
    expect(onDeclineUpdate).not.toHaveBeenCalled();
    expect(onAcceptUpdate).not.toHaveBeenCalled();
    expect(onCloseSheet).not.toHaveBeenCalled();
    expect(onQuit).not.toHaveBeenCalled();
  });

  it("should reopen the firmware offer when install is pressed after the drawer is closed", async () => {
    const { user, onAcceptUpdate, onDeclineUpdate } = renderChecks("updating", {
      update: { current: "1.0.0", available: "1.1.0" },
    });

    await user.press(screen.getByTestId("modal-close-button"));
    await user.press(screen.getByRole("button", { name: "Install Ledger OS update" }));

    expect(screen.getByText(/Version 1\.1\.0/)).toBeVisible();
    expect(screen.getByText(/Ledger\s+Stax OS update available/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(onAcceptUpdate).not.toHaveBeenCalled();
    expect(onDeclineUpdate).not.toHaveBeenCalled();
  });

  it("should decline the update once from the skip action after the drawer is closed", async () => {
    const { user, onAcceptUpdate, onDeclineUpdate } = renderChecks("updating", {
      update: { current: "1.0.0", available: "1.1.0" },
    });

    await user.press(screen.getByTestId("modal-close-button"));
    await user.press(screen.getByRole("button", { name: "Skip Ledger OS update" }));

    expect(onDeclineUpdate).toHaveBeenCalledTimes(1);
    expect(onAcceptUpdate).not.toHaveBeenCalled();
  });

  it("should keep the checks screen unchanged when no update is offered", () => {
    renderChecks("updating", { update: null });

    expect(screen.getByText("Check your device")).toBeVisible();
    expect(screen.getByText("Checking...")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Install Ledger OS update" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Skip Ledger OS update" })).toBeNull();
  });

  it("should keep the allow sheet mounted and closed while sheets are suspended", () => {
    const { onQuit, rerender } = renderChecks("awaitingAllow");

    rerender({ suspendSheets: true });

    expect(screen.getByTestId(checksTestIds.allowSheet)).toHaveProp("accessibilityState", {
      expanded: false,
    });
    expect(screen.queryByTestId(`${checksTestIds.allowSheet}-header-close`)).toBeNull();
    expect(onQuit).not.toHaveBeenCalled();
  });

  it("should show the firmware offer again after it was hidden while the device was locked", () => {
    const { onDeclineUpdate, rerender } = renderChecks("updating", {
      update: { current: "1.0.0", available: "1.1.0" },
    });

    rerender({ state: "synchronizing", update: null });

    expect(onDeclineUpdate).not.toHaveBeenCalled();
    expect(screen.queryByText(/Version 1\.1\.0/)).toBeNull();

    rerender({ state: "updating", update: { current: "1.0.0", available: "1.1.0" } });

    expect(screen.getByText(/Version 1\.1\.0/)).toBeVisible();
    expect(onDeclineUpdate).not.toHaveBeenCalled();
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

  it("should not show the firmware offer again once the update is being installed", async () => {
    const { user, rerender } = renderChecks("updating", {
      device: nanoX,
      update: { current: "2.4.0", available: "2.5.0" },
    });

    await user.press(screen.getByText("Update now"));
    rerender({ state: "checking" });

    expect(screen.queryByText(/Version 2\.5\.0/)).toBeNull();
  });

  it("should keep the unsupported update drawer when sheets are suspended", async () => {
    const platform = jest.replaceProperty(Platform, "OS", "android");

    try {
      const { onAcceptUpdate, onDeclineUpdate, rerender, user } = renderChecks("updating", {
        device: nanoX,
        update: { current: "2.3.0", available: "2.5.0" },
      });

      await user.press(screen.getByText("Update now"));
      expect(screen.getByText("USB cable needed")).toBeVisible();

      rerender({ suspendSheets: true });

      expect(screen.queryByText("USB cable needed")).toBeNull();
      expect(onAcceptUpdate).not.toHaveBeenCalled();
      expect(onDeclineUpdate).not.toHaveBeenCalled();

      rerender({ suspendSheets: false });

      expect(screen.getByText("USB cable needed")).toBeVisible();
      expect(screen.queryByText("Update now")).toBeNull();
      expect(onDeclineUpdate).not.toHaveBeenCalled();
    } finally {
      platform.restore();
    }
  });

  it("should show the update offer again when the unsupported drawer is closed", async () => {
    const { user, onDeclineUpdate, onAcceptUpdate } = renderChecks("updating", {
      device: nanoX,
      update: { current: "2.3.0", available: "2.5.0" },
    });

    await user.press(screen.getByText("Update now"));
    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(screen.getByText("Update now")).toBeVisible();
    expect(onDeclineUpdate).not.toHaveBeenCalled();
    expect(onAcceptUpdate).not.toHaveBeenCalled();
  });

  it.each<{
    kind: GenuineErrorKind;
    title: string;
    showsSettings: boolean;
    cancelLabel: string;
    sheetId: string;
  }>([
    {
      kind: "declined",
      title: "Operation rejected on Ledger device",
      showsSettings: false,
      cancelLabel: "Close",
      sheetId: checksTestIds.declinedSheet,
    },
    {
      kind: "network",
      title: "Network error",
      showsSettings: false,
      cancelLabel: "Close",
      sheetId: checksTestIds.networkSheet,
    },
    {
      kind: "unknown",
      title: "Ledger Genuine Check error",
      showsSettings: false,
      cancelLabel: "Cancel set up",
      sheetId: checksTestIds.unknownSheet,
    },
    {
      kind: "provider",
      title: "Initiate Ledger Genuine Check again",
      showsSettings: true,
      cancelLabel: "Cancel set up",
      sheetId: checksTestIds.providerSheet,
    },
  ])(
    "should leave onboarding when cancelling the $kind drawer",
    async ({ kind, title, showsSettings, cancelLabel, sheetId }) => {
      const { user, onCloseSheet, onQuit, rerender } = renderChecks("checking", {
        error: { kind },
      });
      onCloseSheet.mockImplementation(() => {
        rerender({ error: null });
      });

      expect(screen.getByText("Check your device")).toBeVisible();
      expect(screen.getByText(title)).toBeVisible();
      expect(screen.queryByText("Go to settings") !== null).toBe(showsSettings);

      await user.press(
        within(screen.getByTestId(sheetId)).getByRole("button", { name: cancelLabel }),
      );

      expect(onQuit).toHaveBeenCalledTimes(1);
      expect(onCloseSheet).not.toHaveBeenCalled();
    },
  );

  it("should open experimental settings from the provider sheet", async () => {
    mockNavigate.mockClear();
    jest.mocked(track).mockClear();
    jest.mocked(TrackScreen).mockClear();
    const { user } = renderChecks("checking", { error: { kind: "provider" } });

    expect(screen.getByText("Initiate Ledger Genuine Check again")).toBeVisible();
    expect(jest.mocked(TrackScreen)).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Error: Device OS version not recognized",
        type: "drawer",
        refreshSource: false,
      }),
      undefined,
    );

    await user.press(
      within(screen.getByTestId(checksTestIds.providerSheet)).getByRole("button", {
        name: "Go to settings",
      }),
    );

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Go to settings",
      page: "Error: Ledger Stax OS version not recognized",
    });
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Base, {
      screen: NavigatorName.Settings,
      params: { screen: ScreenName.ExperimentalSettings },
    });
  });

  it("should track the cancel of the provider sheet on its own page", async () => {
    jest.mocked(track).mockClear();
    const { user } = renderChecks("checking", { error: { kind: "provider" } });

    await user.press(
      within(screen.getByTestId(checksTestIds.providerSheet)).getByRole("button", {
        name: "Cancel set up",
      }),
    );

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Cancel",
      page: "Error: Device OS version not recognized",
    });
  });

  it("should retry the genuine check from the unknown sheet", async () => {
    const { user, onRetry, onQuit } = renderChecks("checking", { error: { kind: "unknown" } });

    await user.press(
      within(screen.getByTestId(checksTestIds.unknownSheet)).getByRole("button", {
        name: "Try again",
      }),
    );

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onQuit).not.toHaveBeenCalled();
  });

  it.each<GenuineErrorKind>(["declined", "network", "unknown", "provider"])(
    "should tell the machine the %s sheet was closed without a button",
    async kind => {
      const { user, onCloseSheet, onQuit } = renderChecks("checking", { error: { kind } });

      await user.press(screen.getByTestId(`${errorSheetIds[kind]}-dismiss`));

      expect(onCloseSheet).toHaveBeenCalledTimes(1);
      expect(onQuit).not.toHaveBeenCalled();
    },
  );

  it("should not offer a retry on the network sheet", () => {
    renderChecks("checking", { error: { kind: "network" } });

    expect(
      within(screen.getByTestId(checksTestIds.networkSheet)).queryByRole("button", {
        name: "Retry",
      }),
    ).toBeNull();
  });

  it("should track the declined sheet the way the genuine check drawer did", async () => {
    jest.mocked(track).mockClear();
    jest.mocked(TrackScreen).mockClear();
    const { user, onRetry } = renderChecks("checking", { error: { kind: "declined" } });

    expect(jest.mocked(TrackScreen)).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Error: unknown error",
        type: "drawer",
        refreshSource: false,
      }),
      undefined,
    );

    await user.press(
      within(screen.getByTestId(checksTestIds.declinedSheet)).getByRole("button", {
        name: "Retry",
      }),
    );
    await user.press(
      within(screen.getByTestId(checksTestIds.declinedSheet)).getByRole("button", {
        name: "Close",
      }),
    );

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Try again",
      page: "Error: unknown error",
    });
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Cancel",
      page: "Error: unknown error",
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should track network support separately from a non genuine device", async () => {
    jest.mocked(track).mockClear();
    const { user } = renderChecks("checking", { error: { kind: "network" } });

    await user.press(
      within(screen.getByTestId(checksTestIds.networkSheet)).getByRole("button", {
        name: "Contact Ledger support",
      }),
    );

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Contact Ledger Support",
      page: "Error: unknown error",
    });
    expect(track).not.toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Contacting support about non genuine device" }),
    );
  });

  it("should track support from the non genuine sheet on its own", async () => {
    jest.mocked(track).mockClear();
    jest.mocked(TrackScreen).mockClear();
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const { user } = renderChecks("checking", { error: { kind: "notGenuine" } });

    expect(jest.mocked(TrackScreen)).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Device not genuine",
        type: "drawer",
        refreshSource: false,
      }),
      undefined,
    );

    await user.press(
      within(screen.getByTestId(checksTestIds.notGenuineSheet)).getByRole("button", {
        name: "Contact Ledger Support",
      }),
    );

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Contacting support about non genuine device",
    });
    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://support.ledger.com/article/4423020306705-zd",
    );
  });

  it("should retry the genuine check from the declined sheet", async () => {
    const { user, onRetry, onCloseSheet, onQuit, rerender } = renderChecks("checking", {
      error: { kind: "declined" },
    });
    onRetry.mockImplementation(() => {
      rerender({ error: null });
    });

    await user.press(
      within(screen.getByTestId(checksTestIds.declinedSheet)).getByRole("button", {
        name: "Retry",
      }),
    );

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onCloseSheet).not.toHaveBeenCalled();
    expect(
      within(screen.getByTestId(checksTestIds.declinedSheet)).queryByRole("button", {
        name: "Retry",
      }),
    ).toBeNull();
    expect(onQuit).not.toHaveBeenCalled();
  });

  it("should leave onboarding when closing the non genuine drawer", async () => {
    const { user, onCloseSheet, onQuit } = renderChecks("checking", {
      error: { kind: "notGenuine" },
    });

    expect(screen.getByText("Check your device")).toBeVisible();
    expect(screen.getByText("This Ledger Stax failed the Ledger Genuine Check")).toBeVisible();
    expect(screen.queryByText("Go to settings")).toBeNull();

    await user.press(screen.getByTestId(`${checksTestIds.notGenuineSheet}-dismiss`));

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onCloseSheet).not.toHaveBeenCalled();
  });

  it("should stay on the check when the non genuine close is separate", async () => {
    const onCloseNotGenuine = jest.fn();
    const { user, onQuit, onCloseSheet } = renderChecks("checking", {
      error: { kind: "notGenuine" },
      onCloseNotGenuine,
    });

    await user.press(screen.getByTestId(`${checksTestIds.notGenuineSheet}-dismiss`));

    expect(onCloseNotGenuine).toHaveBeenCalledTimes(1);
    expect(onQuit).not.toHaveBeenCalled();
    expect(onCloseSheet).not.toHaveBeenCalled();
  });
});
