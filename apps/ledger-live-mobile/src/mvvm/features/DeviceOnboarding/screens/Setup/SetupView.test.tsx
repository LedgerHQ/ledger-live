import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
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
  const onLeave = jest.fn();
  const checkProps = checks(checkOverrides);
  const props: SetupScreenProps = {
    device,
    stage: { index: 0, total: 5, kind: "checks", indicator: "loading" },
    firmwareUpToDate: true,
    leaveRequest: 0,
    onLeave,
    ...overrides,
    checks: checkProps,
  };
  const view = render(<SetupScreen {...props} />);

  return {
    ...view,
    onLeave,
    onStart: checkProps.onStart,
    onRetry: checkProps.onRetry,
    onCloseSheet: checkProps.onCloseSheet,
    onAcceptUpdate: checkProps.onAcceptUpdate,
    onDeclineUpdate: checkProps.onDeclineUpdate,
    props,
  };
}

describe("SetupView", () => {
  it("should show the genuine check stage while the checks are running", () => {
    renderSetup();

    expect(screen.getByText("1 of 5")).toBeVisible();
    expect(screen.getByText("Genuine check")).toBeVisible();
    expect(screen.getByText("Confirming your Ledger is genuine and up to date.")).toBeVisible();
    expect(screen.getByText("Checking")).toBeVisible();
  });

  it("should open the quit confirmation from the close bar and leave only from that sheet", async () => {
    const { user, onLeave } = renderSetup();

    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(screen.getByText("Leave setup?")).toBeVisible();
    expect(onLeave).not.toHaveBeenCalled();

    await user.press(screen.getByRole("button", { name: "Continue setup" }));

    expect(onLeave).not.toHaveBeenCalled();
    expect(screen.queryByText("Leave setup?")).toBeNull();

    await user.press(screen.getByTestId(setupTestIds.close));
    await user.press(screen.getByRole("button", { name: "Leave" }));

    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("should open the quit sheet when leaving is requested again", async () => {
    const { user, rerender, props } = renderSetup();

    rerender(<SetupScreen {...props} leaveRequest={1} />);

    expect(screen.getByText("Leave setup?")).toBeVisible();
    expect(props.onLeave).not.toHaveBeenCalled();

    await user.press(screen.getByRole("button", { name: "Continue setup" }));

    expect(screen.queryByText("Leave setup?")).toBeNull();

    rerender(<SetupScreen {...props} leaveRequest={2} />);

    expect(screen.getByText("Leave setup?")).toBeVisible();
  });

  it("should ask before leaving when cancelling a recoverable genuine check error", async () => {
    const { user, onLeave, onCloseSheet, rerender, props } = renderSetup({
      checks: { error: { kind: "network" } },
    });

    expect(screen.getByText("Ledger Genuine Check error")).toBeVisible();

    await user.press(screen.getByText("Cancel set up"));

    expect(onCloseSheet).toHaveBeenCalledTimes(1);
    expect(onLeave).not.toHaveBeenCalled();
    expect(screen.getByText("Leave setup?")).toBeVisible();

    const checks = props.checks;
    if (!checks) throw new Error("checks are required");

    rerender(<SetupScreen {...props} checks={{ ...checks, error: null, state: "idle" }} />);

    expect(screen.queryByText("Ledger Genuine Check error")).toBeNull();
    expect(screen.getByText("Leave setup?")).toBeVisible();

    await user.press(screen.getByRole("button", { name: "Continue setup" }));

    expect(onLeave).not.toHaveBeenCalled();
    expect(screen.queryByText("Leave setup?")).toBeNull();
    expect(screen.getByRole("button", { name: "Check my device" })).toBeVisible();
  });

  it("should close a not-genuine result without leaving the genuine check stage", async () => {
    const { user, onLeave, onCloseSheet } = renderSetup({
      checks: { error: { kind: "notGenuine" } },
    });

    expect(screen.getByText("Genuine check")).toBeVisible();
    expect(screen.getByText("This Ledger Stax failed the Ledger Genuine Check")).toBeVisible();

    await user.press(screen.getByTestId("modal-close-button"));

    expect(onCloseSheet).toHaveBeenCalledTimes(1);
    expect(onLeave).not.toHaveBeenCalled();
  });

  it("should accept an eligible firmware update", async () => {
    const { user, onLeave, onAcceptUpdate } = renderSetup({
      device: nanoX,
      checks: {
        state: "updating",
        update: { current: "2.4.0", available: "2.5.0" },
      },
    });

    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();

    await user.press(screen.getByText("Update now"));

    expect(onAcceptUpdate).toHaveBeenCalledTimes(1);
    expect(onLeave).not.toHaveBeenCalled();
  });

  it("should dismiss the quit confirmation from the backdrop without leaving", async () => {
    const { user, onLeave } = renderSetup();

    await user.press(screen.getByRole("button", { name: "Close" }));
    await user.press(screen.getByTestId(`${setupTestIds.quit}-dismiss`));

    expect(onLeave).not.toHaveBeenCalled();
    expect(screen.queryByText("Leave setup?")).toBeNull();
  });

  it("should start a cancelled genuine check again", async () => {
    const { user, onStart } = renderSetup({
      checks: { state: "idle" },
    });

    expect(screen.queryByText("Checking")).toBeNull();

    await user.press(screen.getByRole("button", { name: "Check my device" }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("should bring the approval instructions back when setup continues", async () => {
    const { user, onLeave } = renderSetup({
      checks: { state: "awaitingAllow" },
    });
    const allowTitle = "Tap on “Allow” to start Ledger Genuine Check";

    expect(screen.getByText(allowTitle)).toBeVisible();

    await user.press(screen.getByTestId(`${setupTestIds.allowSheet}-header-close`));

    expect(screen.getByText("Leave setup?")).toBeVisible();
    expect(screen.queryByText(allowTitle)).toBeNull();
    expect(onLeave).not.toHaveBeenCalled();

    await user.press(screen.getByRole("button", { name: "Continue setup" }));

    expect(screen.getByText(allowTitle)).toBeVisible();
    expect(screen.queryByText("Leave setup?")).toBeNull();
    expect(onLeave).not.toHaveBeenCalled();
  });

  it.each([
    [
      "a new seed",
      undefined,
      "Copy the recovery phrase from your Ledger onto your Recovery sheet.",
    ],
    [
      "a Recovery Key backup",
      "recoveryKey" as const,
      "Back up your Secret Recovery Phrase on your Recovery Key.",
    ],
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

  it.each([
    [true, "Device genuine and up-to-date"],
    [false, "Device genuine"],
  ])("should report firmware %s as %s", (firmwareUpToDate, label) => {
    renderSetup({
      firmwareUpToDate,
      stage: { index: 0, total: 5, kind: "checks", indicator: "success" },
    });

    expect(screen.getByText(label)).toBeVisible();
  });
});
