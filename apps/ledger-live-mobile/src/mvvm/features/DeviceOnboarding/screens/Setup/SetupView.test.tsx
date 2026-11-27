import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Stepper } from "@ledgerhq/lumen-ui-rnative";
import { render, screen, within } from "@tests/test-renderer";
import { setupTestIds } from "LLM/features/DeviceOnboarding/testIds";
import { updateOfferTestIds } from "@features/flow-device-onboarding-update-offer/testing";
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
    confirmSkipUpdate: false,
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

function expanded(testID: string) {
  return screen.getByTestId(testID).props.accessibilityState?.expanded;
}

function UNSAFE_getStepper() {
  return screen.UNSAFE_getByType(Stepper);
}

describe("SetupView", () => {
  it("should show the genuine check stage while the checks are running", () => {
    renderSetup();

    expect(screen.getByText("Continue on your Ledger device")).toBeVisible();
    expect(screen.getByText("Genuine & OS check")).toBeVisible();
    expect(screen.getByText("Verifying your device")).toBeVisible();
    expect(screen.getByTestId(setupTestIds.stageLoading)).toBeVisible();
  });

  it("should keep the same bottom glow when the device moves to the next stage", () => {
    const { rerender, props } = renderSetup();
    const glow = screen.getByTestId(setupTestIds.glow);

    expect(glow).toHaveProp("showBottom", true);
    expect(glow).toHaveProp("showTop", false);
    expect(glow).toHaveProp("pointerEvents", "none");

    rerender(
      <SetupScreen
        {...props}
        stage={{ index: 1, total: 5, kind: "naming", indicator: "none" }}
        checks={null}
      />,
    );

    expect(screen.getByText("Device name")).toBeVisible();
    expect(screen.getByTestId(setupTestIds.glow)).toBe(glow);
  });

  it("should not ask to continue on the device while it waits for the check approval", () => {
    renderSetup({ checks: { state: "awaitingAllow" } });

    expect(screen.queryByTestId(setupTestIds.allowSheet)).toBeNull();
    expect(screen.getByText("Genuine & OS check")).toBeVisible();
    expect(screen.getByTestId(setupTestIds.stageLoading)).toBeVisible();
  });

  it.each([
    [0, "1/5"],
    [2, "3/5"],
  ])(
    "should fill only the finished steps on step %i and still count the current one",
    (index, label) => {
      renderSetup({
        stage: { index, total: 5, kind: index === 0 ? "checks" : "pin", indicator: "none" },
      });

      const stepper = UNSAFE_getStepper();
      expect(stepper.props.currentStep).toBe(index);
      expect(stepper.props.totalSteps).toBe(5);
      expect(within(screen.getByTestId(setupTestIds.stepper)).getByText(label)).toBeVisible();
    },
  );

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

  it("should offer the OS update in a sheet instead of footer buttons", () => {
    renderSetup({
      checks: { state: "updating", update: { current: "1.0.0", available: "1.1.0" } },
    });

    expect(expanded(updateOfferTestIds.offerSheet)).toBe(true);
    expect(screen.getByText(/OS 1\.0\.0 → OS 1\.1\.0/)).toBeVisible();
    expect(screen.queryByText("Skip Ledger OS update")).toBeNull();
    expect(screen.queryByText(/Version 1\.1\.0/)).toBeNull();
  });

  it("should accept an eligible OS update from the sheet", async () => {
    const { user, onQuit, onAcceptUpdate } = renderSetup({
      device: nanoX,
      checks: { state: "updating", update: { current: "2.4.0", available: "2.5.0" } },
    });

    await user.press(screen.getByTestId(updateOfferTestIds.offerUpdate));

    expect(onAcceptUpdate).toHaveBeenCalledTimes(1);
    expect(onQuit).not.toHaveBeenCalled();
  });

  it("should keep the header close button while the OS update is offered", async () => {
    const { user, onQuit } = renderSetup({
      checks: { state: "updating", update: { current: "1.0.0", available: "1.1.0" } },
    });

    await user.press(screen.getByTestId(setupTestIds.close));

    expect(onQuit).toHaveBeenCalledTimes(1);
  });

  it("should skip the OS update only once the skip is confirmed", async () => {
    const { user, onDeclineUpdate, onAcceptUpdate } = renderSetup({
      checks: { state: "updating", update: { current: "1.0.0", available: "1.1.0" } },
    });

    await user.press(screen.getByTestId(`${updateOfferTestIds.offerSheet}-header-close`));

    expect(expanded(updateOfferTestIds.skipSheet)).toBe(true);
    expect(onDeclineUpdate).not.toHaveBeenCalled();

    await user.press(screen.getByTestId(updateOfferTestIds.skipConfirm));

    expect(onDeclineUpdate).toHaveBeenCalledTimes(1);
    expect(onAcceptUpdate).not.toHaveBeenCalled();
  });

  it("should ask to confirm the skip right away after the release notes closed", () => {
    renderSetup({
      checks: {
        state: "updating",
        update: { current: "1.0.0", available: "1.1.0" },
        confirmSkipUpdate: true,
      },
    });

    expect(expanded(updateOfferTestIds.offerSheet)).toBe(false);
    expect(expanded(updateOfferTestIds.skipSheet)).toBe(true);
  });

  it("should hide the OS update sheets while setup sheets are suspended", () => {
    const { rerender, props } = renderSetup({
      checks: { state: "updating", update: { current: "1.0.0", available: "1.1.0" } },
    });

    rerender(<SetupScreen {...props} suspendSheets />);

    expect(expanded(updateOfferTestIds.offerSheet)).toBe(false);

    rerender(<SetupScreen {...props} suspendSheets={false} />);

    expect(expanded(updateOfferTestIds.offerSheet)).toBe(true);
  });

  it("should close the OS update sheet once the update has been accepted", () => {
    const { rerender, props } = renderSetup({
      checks: { state: "updating", update: { current: "1.0.0", available: "1.1.0" } },
    });
    const checks = props.checks;
    if (!checks) throw new Error("checks are required");

    rerender(<SetupScreen {...props} checks={{ ...checks, state: "checking" }} />);

    expect(expanded(updateOfferTestIds.offerSheet)).toBe(false);
    expect(expanded(updateOfferTestIds.skipSheet)).toBe(false);
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

  it("should tell the device is not up-to-date once the OS update was skipped", () => {
    renderSetup({
      stage: { index: 0, total: 5, kind: "checks", indicator: "success" },
      firmwareDeclined: true,
    });

    expect(screen.getByText("Your device is not up-to-date")).toBeVisible();
    expect(screen.queryByText("Your device is genuine and safe to use")).toBeNull();
  });

  it("should name the device model in the device name stage", () => {
    renderSetup({ stage: { index: 1, total: 5, kind: "naming", indicator: "none" } });

    expect(screen.getByText("Device name")).toBeVisible();
    expect(screen.getByText("Give your Ledger Stax a unique name")).toBeVisible();
  });

  it("should show the setup choice stage without a description", () => {
    renderSetup({ stage: { index: 3, total: 5, kind: "setupChoice", indicator: "none" } });

    expect(screen.getByText("Set up choice")).toBeVisible();
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

  it("should show no info card while the genuine check runs", () => {
    renderSetup();

    expect(screen.queryByText("Set up or restore?")).toBeNull();
  });

  it("should open the stage's info card without touching the device", async () => {
    const { user, onQuit, onStart, onRetry, onCloseSheet, onAcceptUpdate, onDeclineUpdate } =
      renderSetup({
        stage: {
          index: 3,
          total: 5,
          kind: "setupChoice",
          indicator: "none",
          infoCard: "setupChoice",
        },
      });

    await user.press(screen.getByTestId(infoCardTestId));

    expect(infoSheetOpen()).toBe(true);
    for (const callback of [
      onQuit,
      onStart,
      onRetry,
      onCloseSheet,
      onAcceptUpdate,
      onDeclineUpdate,
    ]) {
      expect(callback).not.toHaveBeenCalled();
    }
  });
});

const infoCardTestId = "device-onboarding-setup-info-card";
const infoSheetTestId = "device-onboarding-setup-info-sheet";

/** The card label and the sheet title share their wording: find the sheet by its id. */
function infoSheetOpen() {
  return screen.getByTestId(infoSheetTestId).props.accessibilityState?.expanded;
}

function sheetOpen(text: string) {
  let node = screen.getByText(text).parent;
  while (node && node.props.accessibilityState?.expanded === undefined) node = node.parent;
  return node?.props.accessibilityState?.expanded;
}

describe("SetupView connection sheets", () => {
  const pinStage = { index: 2, total: 5, kind: "pin", indicator: "none" } as const;

  it("should hide an open info sheet while the connection sheet shows, and bring it back after", async () => {
    const stage = {
      index: 3,
      total: 5,
      kind: "setupChoice",
      indicator: "none",
      infoCard: "setupChoice",
    } as const;
    const { user, rerender, props } = renderSetup({ stage });
    await user.press(screen.getByTestId(infoCardTestId));
    expect(infoSheetOpen()).toBe(true);

    rerender(<SetupScreen {...props} connection={{ state: "reconnecting", retry: jest.fn() }} />);
    expect(infoSheetOpen()).toBe(false);
    expect(sheetOpen("Reconnecting to your Ledger Stax")).toBe(true);

    rerender(<SetupScreen {...props} connection={null} />);
    expect(infoSheetOpen()).toBe(true);
  });

  it("should show the reconnecting sheet over the current stage", () => {
    renderSetup({ stage: pinStage, connection: { state: "reconnecting", retry: jest.fn() } });

    expect(screen.getByText("PIN creation")).toBeVisible();
    expect(screen.getByText("Reconnecting to your Ledger Stax")).toBeVisible();
  });

  it("should show no connection sheet while the session is up", () => {
    renderSetup({ stage: pinStage, connection: null });

    expect(screen.queryByText("Reconnecting to your Ledger Stax")).toBeNull();
    expect(screen.queryByText("Couldn't connect to Ledger Stax")).toBeNull();
  });
});
