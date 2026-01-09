import React from "react";
import { render, screen } from "tests/testSetup";
import TwoStepCompanion from "../components/TwoStepCompanion";
import { Step, StepKey } from "../hooks/useCompanionSteps";
import { Flex } from "@ledgerhq/react-ui/index";

jest.mock("../components/NewSeedPanel", () => {
  const NewSeedMock = () => <div data-testid="mock-new-seed-step"></div>;
  return NewSeedMock;
});

const MockPinStep: Step = {
  key: StepKey.Pin,
  status: "active",
  title: "Pin Step",
  titleCompleted: "Pin Step Complete",
  renderBody: () => <Flex flexDirection="column" data-testid="mock-pin-step" />,
};

const MockInstallStep = <Flex data-testid="mock-install-step" />;
const mockHandleComplete = jest.fn();

describe("TwoStepCompanion", () => {
  it("should show companion with first step open and second step closed", () => {
    render(
      <TwoStepCompanion
        steps={[MockPinStep]}
        activeStepKey={StepKey.Pin}
        isNewSeed={true}
        installStep={MockInstallStep}
        deviceName="stax"
        handleComplete={mockHandleComplete}
      />,
    );

    const firstStepTitle = screen.getByText("Pin Step");
    const firstStepTimeline = screen.getByTestId("mock-pin-step");
    const successStep = screen.queryByTestId("sync-onboarding-success-step");
    const secondStep = screen.queryByTestId("mock-new-seed-step");
    const secondStepTitle = screen.getByText("Secure your crypto");

    expect(firstStepTitle).toBeVisible();
    expect(firstStepTimeline).toBeVisible();
    expect(successStep).toBeNull();
    expect(secondStep).toBeNull();
    expect(secondStepTitle).toBeVisible();
  });

  it("should show success step and second step closed", () => {
    render(
      <TwoStepCompanion
        steps={[MockPinStep]}
        activeStepKey={StepKey.Success}
        isNewSeed={true}
        installStep={MockInstallStep}
        deviceName="stax"
        handleComplete={mockHandleComplete}
      />,
    );

    const firstStepTitle = screen.queryByText("Pin Step");
    const firstStepTimeline = screen.queryByTestId("mock-pin-step");
    const successStep = screen.getByTestId("sync-onboarding-success-step");
    const successStepBackground = screen.getByTestId("success-background");
    const secondStep = screen.queryByTestId("mock-new-seed-step");
    const secondStepTitle = screen.getByText("Secure your crypto");

    expect(firstStepTitle).toBeNull();
    expect(firstStepTimeline).toBeNull();
    expect(successStep).toBeVisible();
    expect(successStepBackground).toBeVisible();
    expect(secondStep).toBeNull();
    expect(secondStepTitle).toBeVisible();
  });

  describe("should show companion with first step closed and second step open", () => {
    it("shows new seed panel", async () => {
      render(
        <TwoStepCompanion
          steps={[MockPinStep]}
          activeStepKey={StepKey.Apps}
          isNewSeed={true}
          installStep={MockInstallStep}
          deviceName="stax"
          handleComplete={mockHandleComplete}
        />,
      );

      const firstStepTitle = screen.getByText("Your stax is ready");
      const firstStepTimeline = screen.queryByTestId("mock-pin-step");
      const successStep = screen.queryByTestId("sync-onboarding-success-step");
      const newSeedStep = screen.getByTestId("mock-new-seed-step");
      const secondStepTitle = screen.getByText("Secure your crypto");

      expect(firstStepTitle).toBeVisible();
      expect(firstStepTimeline).toBeNull();
      expect(successStep).toBeNull();
      expect(newSeedStep).toBeVisible();
      expect(secondStepTitle).toBeVisible();
    });

    it("shows install step panel", async () => {
      render(
        <TwoStepCompanion
          steps={[MockPinStep]}
          activeStepKey={StepKey.Apps}
          isNewSeed={false}
          installStep={MockInstallStep}
          deviceName="stax"
          handleComplete={mockHandleComplete}
        />,
      );

      const firstStepTitle = screen.getByText("Your stax is ready");
      const firstStepTimeline = screen.queryByTestId("mock-pin-step");
      const successStep = screen.queryByTestId("sync-onboarding-success-step");
      const installStep = screen.getByTestId("mock-install-step");
      const secondStepTitle = screen.getByText("Secure your crypto");

      expect(firstStepTitle).toBeVisible();
      expect(firstStepTimeline).toBeNull();
      expect(successStep).toBeNull();
      expect(installStep).toBeVisible();
      expect(secondStepTitle).toBeVisible();
    });
  });

  it("shows completed companion", async () => {
    render(
      <TwoStepCompanion
        steps={[MockPinStep]}
        activeStepKey={StepKey.Ready}
        isNewSeed={false}
        installStep={MockInstallStep}
        deviceName="stax"
        handleComplete={mockHandleComplete}
      />,
    );

    const firstStepTitle = screen.getByText("Your stax is ready");
    const firstStepTimeline = screen.queryByTestId("mock-pin-step");
    const successStep = screen.queryByTestId("sync-onboarding-success-step");
    const installStep = screen.queryByTestId("mock-install-step");
    const secondStepTitle = screen.getByText("Your blockchain apps are installed.");

    expect(firstStepTitle).toBeVisible();
    expect(firstStepTimeline).toBeNull();
    expect(successStep).toBeNull();
    expect(installStep).toBeNull();
    expect(secondStepTitle).toBeVisible();
  });
});
