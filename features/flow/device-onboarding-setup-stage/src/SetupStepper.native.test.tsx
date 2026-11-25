import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { render, renderHook, screen, within } from "@testing-library/react-native";
import { SetupStepper } from "./SetupStepper";
import type { SetupStepperProps } from "./SetupStepper.types";
import { setupStepperTestIds } from "./internals";
import type { SetupStage } from "./toSetupStage";
import { useSetupStepperViewModel } from "./useSetupStepperViewModel";

const COPY = {
  en: {
    translation: {
      "deviceOnboarding.setup.checks.title": "Genuine & OS check",
      "deviceOnboarding.setup.checks.description": "Verifying your device",
      "deviceOnboarding.setup.checks.successDescription": "Your device is genuine and safe to use",
      "deviceOnboarding.setup.checks.notUpToDateDescription": "Your device is not up-to-date",
      "deviceOnboarding.setup.genuine.title": "Ledger Genuine Check",
      "deviceOnboarding.setup.genuine.description": "Confirming Ledger OS is safe to use.",
      "deviceOnboarding.setup.genuine.successDescription": "Ledger OS is genuine and safe to use.",
      "deviceOnboarding.setup.osCheck.title": "Ledger OS version check",
      "deviceOnboarding.setup.osCheck.description": "Checking...",
      "deviceOnboarding.setup.naming.title": "Device name",
      "deviceOnboarding.setup.naming.description": "Give your {{productName}} a unique name",
      "deviceOnboarding.setup.pin.title": "PIN creation",
      "earlySecurityCheck.genuineCheckNonGenuineDrawer.title": "Device not genuine",
    },
  },
};

function stage(overrides: Partial<SetupStage>): SetupStage {
  return { index: 0, total: 5, kind: "checks", indicator: "loading", ...overrides };
}

function renderStepper(props: Partial<SetupStepperProps> = {}) {
  render(
    <I18nTestProvider resources={COPY}>
      <SetupStepper
        stage={stage({})}
        checksIdle={false}
        notGenuine={false}
        firmwareDeclined={false}
        productName="Ledger Nano X"
        {...props}
      />
    </I18nTestProvider>,
  );
  return within(screen.getByTestId(setupStepperTestIds.stepper));
}

function viewModel(props: Partial<SetupStepperProps>) {
  const { result } = renderHook(
    () =>
      useSetupStepperViewModel({
        stage: stage({}),
        checksIdle: false,
        notGenuine: false,
        firmwareDeclined: false,
        productName: "Ledger Nano X",
        ...props,
      }),
    { wrapper: ({ children }) => <I18nTestProvider resources={COPY}>{children}</I18nTestProvider> },
  );
  return result.current;
}

describe("SetupStepper", () => {
  it("should count the steps from one", () => {
    expect(viewModel({ stage: stage({ index: 2, total: 4, kind: "pin" }) })).toMatchObject({
      label: "3/4",
      completedSteps: 2,
      totalSteps: 4,
      title: "PIN creation",
    });
  });

  it("should show the genuine check alone with its progress", () => {
    const stepper = renderStepper({ stage: stage({ kind: "genuine" }) });

    expect(stepper.getByText("Ledger Genuine Check")).toBeVisible();
    expect(stepper.getByText("Confirming Ledger OS is safe to use.")).toBeVisible();
    expect(screen.getByTestId(setupStepperTestIds.stageLoading)).toBeVisible();
  });

  it("should confirm a passed genuine check", () => {
    const stepper = renderStepper({ stage: stage({ kind: "genuine", indicator: "success" }) });

    expect(stepper.getByText("Ledger OS is genuine and safe to use.")).toBeVisible();
    expect(screen.getByTestId(setupStepperTestIds.stageSuccess)).toBeVisible();
  });

  it("should show the OS version check as the last step", () => {
    const stepper = renderStepper({ stage: stage({ index: 4, kind: "osCheck" }) });

    expect(viewModel({ stage: stage({ index: 4, kind: "osCheck" }) }).label).toBe("5/5");
    expect(stepper.getByText("Ledger OS version check")).toBeVisible();
    expect(stepper.getByText("Checking...")).toBeVisible();
  });

  it("should end the OS version check without a description once up to date", () => {
    const stepper = renderStepper({
      stage: stage({ index: 4, kind: "osCheck", indicator: "success" }),
    });

    expect(stepper.queryByText("Checking...")).toBeNull();
    expect(stepper.queryByText("Your device is not up-to-date")).toBeNull();
  });

  it("should end the OS version check as not up to date when the update was skipped", () => {
    const stepper = renderStepper({
      stage: stage({ index: 4, kind: "osCheck", indicator: "success" }),
      firmwareDeclined: true,
    });

    expect(stepper.getByText("Your device is not up-to-date")).toBeVisible();
  });

  it("should show no progress while the checks wait for the user", () => {
    renderStepper({ checksIdle: true });

    expect(screen.queryByTestId(setupStepperTestIds.stageLoading)).toBeNull();
    expect(screen.queryByTestId(setupStepperTestIds.stageSuccess)).toBeNull();
  });

  it("should say the device is not genuine once the paused checks found it", () => {
    const stepper = renderStepper({ checksIdle: true, notGenuine: true });

    expect(stepper.getByText("Device not genuine")).toBeVisible();
  });

  it("should name the product in the device name step", () => {
    const stepper = renderStepper({ stage: stage({ index: 1, kind: "naming" }) });

    expect(stepper.getByText("Give your Ledger Nano X a unique name")).toBeVisible();
  });

  it("should let the bottom glow show through the card", () => {
    renderStepper();

    expect(screen.getByTestId(setupStepperTestIds.stepper).props.lx).toMatchObject({
      backgroundColor: "surfaceTransparent",
    });
  });
});
