import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen, within } from "@tests/test-renderer";
import { setupTestIds } from "LLM/features/DeviceOnboarding/testIds";
import { SetupScreen } from "./index";
import type { SetupChecksProps, SetupScreenProps } from "./types";

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

function checks(overrides: Partial<SetupChecksProps> = {}): SetupChecksProps {
  return {
    state: "checking",
    error: null,
    deviceNotGenuine: false,
    update: null,
    onStart: jest.fn(),
    onRetry: jest.fn(),
    onCloseSheet: jest.fn(),
    onAcceptUpdate: jest.fn(),
    onDeclineUpdate: jest.fn(),
    ...overrides,
  };
}

function renderSetup({
  checks: checkOverrides,
  ...overrides
}: Partial<Omit<SetupScreenProps, "checks">> & {
  checks?: Partial<SetupChecksProps>;
} = {}) {
  const onQuit = jest.fn();
  const checkProps = checks(checkOverrides);
  const props: SetupScreenProps = {
    device,
    stage: { index: 0, total: 5, kind: "checks", indicator: "loading" },
    onQuit,
    ...overrides,
    checks: checkProps,
  };
  const view = render(<SetupScreen {...props} />);

  return {
    ...view,
    onQuit,
    onStart: checkProps.onStart,
    onRetry: checkProps.onRetry,
    onCloseSheet: checkProps.onCloseSheet,
    onAcceptUpdate: checkProps.onAcceptUpdate,
    onDeclineUpdate: checkProps.onDeclineUpdate,
    props,
  };
}

function allowSheet() {
  return screen.getByTestId(setupTestIds.allowSheet);
}

describe("SetupView", () => {
  it("should show the genuine check stage while the checks are running", () => {
    renderSetup();

    expect(screen.getByText("Continue on your Ledger device")).toBeVisible();
    expect(screen.getByTestId(setupTestIds.allowSheet)).toHaveProp("accessibilityState", {
      expanded: false,
    });
    expect(screen.getByText("Genuine & OS check")).toBeVisible();
    expect(screen.getByText("Verifying your device")).toBeVisible();
    expect(screen.getByTestId(setupTestIds.stageLoading)).toBeVisible();
  });

  it("should ask to quit from the close bar", async () => {
    const { user, onQuit } = renderSetup();

    await user.press(screen.getByTestId(setupTestIds.close));

    expect(onQuit).toHaveBeenCalledTimes(1);
  });

  it("should ask before leaving when cancelling a recoverable genuine check error", async () => {
    const { user, onQuit, onCloseSheet } = renderSetup({
      checks: { error: { kind: "unknown" } },
    });

    expect(screen.getByText("Ledger Genuine Check error")).toBeVisible();

    await user.press(screen.getByText("Cancel set up"));

    expect(onCloseSheet).toHaveBeenCalledTimes(1);
    expect(onQuit).toHaveBeenCalledTimes(1);
  });

  it("should close a not-genuine result without leaving the genuine check stage", async () => {
    const { user, onQuit, onCloseSheet } = renderSetup({
      checks: { error: { kind: "notGenuine" } },
    });

    expect(screen.getByText("Genuine & OS check")).toBeVisible();
    expect(screen.getByText("This Ledger Stax failed the Ledger Genuine Check")).toBeVisible();

    await user.press(screen.getByTestId(`${setupTestIds.notGenuineSheet}-dismiss`));

    expect(onCloseSheet).toHaveBeenCalledTimes(1);
    expect(onQuit).not.toHaveBeenCalled();
  });

  it("should keep a dismissed firmware offer hidden on the next check until Update now is pressed", async () => {
    const { user, rerender, props } = renderSetup({
      checks: {
        state: "updating",
        update: { current: "1.0.0", available: "1.1.0" },
      },
    });
    const checks = props.checks;
    if (!checks) throw new Error("checks are required");

    await user.press(screen.getByTestId("modal-close-button"));

    expect(screen.queryByText(/Version 1\.1\.0/)).toBeNull();
    expect(screen.getByRole("button", { name: "Update now" })).toBeVisible();

    rerender(<SetupScreen {...props} checks={{ ...checks, state: "idle", update: null }} />);
    rerender(
      <SetupScreen
        {...props}
        checks={{
          ...checks,
          state: "updating",
          update: { current: "1.0.0", available: "1.1.0" },
        }}
      />,
    );

    expect(screen.queryByText(/Version 1\.1\.0/)).toBeNull();
    expect(screen.getByRole("button", { name: "Update now" })).toBeVisible();

    await user.press(screen.getByRole("button", { name: "Update now" }));

    expect(screen.getByText(/Version 1\.1\.0/)).toBeVisible();
    expect(screen.queryByTestId(setupTestIds.reopenUpdate)).toBeNull();

    await user.press(screen.getByTestId("modal-close-button"));

    expect(screen.queryByText(/Version 1\.1\.0/)).toBeNull();
    expect(props.checks?.onAcceptUpdate).not.toHaveBeenCalled();
  });

  it("should skip a dismissed firmware offer", async () => {
    const { user, onDeclineUpdate, onAcceptUpdate } = renderSetup({
      checks: {
        state: "updating",
        update: { current: "1.0.0", available: "1.1.0" },
      },
    });

    await user.press(screen.getByTestId("modal-close-button"));
    await user.press(screen.getByTestId(setupTestIds.skipUpdate));

    expect(onDeclineUpdate).toHaveBeenCalledTimes(1);
    expect(onAcceptUpdate).not.toHaveBeenCalled();
  });

  it("should close the firmware offer once the update has been accepted", () => {
    const { rerender, props } = renderSetup({
      checks: { state: "updating", update: { current: "1.0.0", available: "1.1.0" } },
    });
    const checks = props.checks;
    if (!checks) throw new Error("checks are required");

    expect(screen.getByText(/Version 1\.1\.0/)).toBeVisible();

    rerender(<SetupScreen {...props} checks={{ ...checks, state: "checking" }} />);

    expect(screen.queryByText(/Version 1\.1\.0/)).toBeNull();
    expect(screen.queryByTestId(setupTestIds.reopenUpdate)).toBeNull();
    expect(screen.queryByTestId(setupTestIds.skipUpdate)).toBeNull();
  });

  it("should reopen a dismissed firmware offer without accepting it", async () => {
    const onAcceptUpdate = jest.fn();
    const { user } = renderSetup({
      checks: {
        state: "updating",
        update: { current: "1.0.0", available: "1.1.0" },
        onAcceptUpdate,
      },
    });

    await user.press(screen.getByTestId("modal-close-button"));
    await user.press(screen.getByTestId(setupTestIds.reopenUpdate));

    expect(screen.getByText(/Version 1\.1\.0/)).toBeVisible();
    expect(onAcceptUpdate).not.toHaveBeenCalled();
  });

  it("should hide an open approval sheet while setup sheets are suspended", () => {
    const { rerender, props } = renderSetup({ checks: { state: "awaitingAllow" } });

    expect(screen.getByTestId(setupTestIds.allowSheet)).toHaveProp("accessibilityState", {
      expanded: true,
    });

    rerender(<SetupScreen {...props} suspendSheets />);

    expect(screen.getByTestId(setupTestIds.allowSheet)).toHaveProp("accessibilityState", {
      expanded: false,
    });

    rerender(<SetupScreen {...props} suspendSheets={false} />);

    expect(screen.getByTestId(setupTestIds.allowSheet)).toHaveProp("accessibilityState", {
      expanded: true,
    });
  });

  it("should hide a firmware offer while setup sheets are suspended", () => {
    const { rerender, props } = renderSetup({
      checks: {
        state: "updating",
        update: { current: "1.0.0", available: "1.1.0" },
      },
    });

    expect(screen.getByText(/Version 1\.1\.0/)).toBeVisible();

    rerender(<SetupScreen {...props} suspendSheets />);

    expect(screen.queryByText(/Version 1\.1\.0/)).toBeNull();
    expect(screen.queryByTestId(setupTestIds.reopenUpdate)).toBeNull();

    rerender(<SetupScreen {...props} suspendSheets={false} />);

    expect(screen.getByText(/Version 1\.1\.0/)).toBeVisible();
  });

  it("should accept an eligible firmware update", async () => {
    const { user, onQuit, onAcceptUpdate } = renderSetup({
      device: nanoX,
      checks: {
        state: "updating",
        update: { current: "2.4.0", available: "2.5.0" },
      },
    });

    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();

    await user.press(screen.getByText("Update now"));

    expect(onAcceptUpdate).toHaveBeenCalledTimes(1);
    expect(onQuit).not.toHaveBeenCalled();
  });

  it("should offer support instead of a retry once the device is not genuine", async () => {
    const { user, onStart, onRetry } = renderSetup({
      checks: { state: "idle", deviceNotGenuine: true },
    });

    expect(
      within(screen.getByTestId(setupTestIds.stepper)).getByText(
        "This Ledger Stax failed the Ledger Genuine Check",
      ),
    ).toBeVisible();
    expect(screen.queryByTestId(setupTestIds.start)).toBeNull();

    await user.press(screen.getByTestId(setupTestIds.contactSupport));

    expect(onStart).not.toHaveBeenCalled();
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("should start a cancelled genuine check again", async () => {
    const { user, onStart } = renderSetup({
      checks: { state: "idle" },
    });

    expect(screen.queryByTestId(setupTestIds.stageLoading)).toBeNull();

    await user.press(screen.getByRole("button", { name: "Check my device" }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("should close the approval sheet once the device has been approved", () => {
    const { rerender, props } = renderSetup({ checks: { state: "awaitingAllow" } });
    const checks = props.checks;
    if (!checks) throw new Error("checks are required");

    expect(screen.getByTestId(setupTestIds.allowSheet)).toHaveProp("accessibilityState", {
      expanded: true,
    });

    rerender(
      <SetupScreen
        {...props}
        stage={{ index: 0, total: 5, kind: "checks", indicator: "success" }}
        checks={null}
      />,
    );

    expect(screen.getByTestId(setupTestIds.allowSheet)).toHaveProp("accessibilityState", {
      expanded: false,
    });
  });

  it("should bring the approval instructions back when setup continues", async () => {
    const { user, onQuit, rerender, props } = renderSetup({
      checks: { state: "awaitingAllow" },
    });
    expect(allowSheet()).toHaveProp("accessibilityState", { expanded: true });

    await user.press(screen.getByTestId(`${setupTestIds.allowSheet}-header-close`));
    rerender(<SetupScreen {...props} suspendSheets />);

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(allowSheet()).toHaveProp("accessibilityState", { expanded: false });

    rerender(<SetupScreen {...props} suspendSheets={false} />);

    expect(allowSheet()).toHaveProp("accessibilityState", { expanded: true });
  });

  it.each([
    ["a new seed", undefined, "Secret Recovery Phrase"],
    ["a Recovery Key backup", "recoveryKey" as const, "Recovery Key"],
  ])("should describe the security stage for %s", (_, detail, description) => {
    renderSetup({
      stage: {
        index: 4,
        total: 5,
        kind: "security",
        indicator: "none",
        ...(detail ? { detail } : {}),
      },
    });

    expect(screen.getByText("Security setup")).toBeVisible();
    expect(screen.getByText(description)).toBeVisible();
  });

  it("should mark the genuine check stage as done once the checks succeed", () => {
    renderSetup({ stage: { index: 0, total: 5, kind: "checks", indicator: "success" } });

    expect(screen.getByText("Your device is genuine and safe to use")).toBeVisible();
    expect(screen.getByTestId(setupTestIds.stageSuccess)).toBeVisible();
    expect(screen.queryByTestId(setupTestIds.stageLoading)).toBeNull();
  });

  it("should name the device model in the device name stage", () => {
    renderSetup({ stage: { index: 1, total: 5, kind: "naming", indicator: "none" } });

    expect(screen.getByText("Device name")).toBeVisible();
    expect(screen.getByText("Give your Ledger Stax a unique name")).toBeVisible();
  });

  it("should show the setup choice stage without a description", () => {
    renderSetup({ stage: { index: 3, total: 5, kind: "setupChoice", indicator: "none" } });

    expect(screen.getByText("Setup choice")).toBeVisible();
    expect(screen.queryByTestId(setupTestIds.stageLoading)).toBeNull();
    expect(screen.queryByTestId(setupTestIds.stageSuccess)).toBeNull();
  });

  it("should describe the recovery phrase entry of a restore", () => {
    renderSetup({
      stage: { index: 4, total: 5, kind: "restore", indicator: "none", detail: "recoveryPhrase" },
    });

    expect(screen.getByText("Restore access")).toBeVisible();
    expect(screen.getByText("Secret Recovery Phrase")).toBeVisible();
  });
});
