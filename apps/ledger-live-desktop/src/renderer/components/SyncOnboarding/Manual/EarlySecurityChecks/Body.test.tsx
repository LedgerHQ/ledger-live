import React from "react";
import { render, screen } from "tests/testSetup";
import Body from "./Body";
import { Status as SoftwareCheckStatus } from "../types";

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

jest.mock("~/renderer/animations", () => ({
  __esModule: true,
  default: () => <div data-testid="animation" />,
}));

const baseProps = {
  genuineCheckStatus: SoftwareCheckStatus.completed,
  firmwareUpdateStatus: SoftwareCheckStatus.updateAvailable,
  availableFirmwareVersion: "2.0.0",
  modelName: "Ledger Stax",
  updateSkippable: true,
  updateInterrupted: false,
  onClickStartChecks: jest.fn(),
  onClickWhyPerformSecurityChecks: jest.fn(),
  onClickResumeGenuineCheck: jest.fn(),
  onClickViewUpdate: jest.fn(),
  onClickSkipUpdate: jest.fn(),
  onClickContinueToSetup: jest.fn(),
  onClickRetryUpdate: jest.fn(),
};

describe("EarlySecurityChecks Body", () => {
  it("should disable the view update button while preparing the firmware update", () => {
    render(<Body {...baseProps} isPreparingFirmwareUpdate={true} />);

    expect(
      screen.getByRole("button", {
        name: "syncOnboarding.manual.softwareCheckContent.firmwareUpdate.viewUpdateCTA",
      }),
    ).toBeDisabled();
  });

  it("should keep the view update button enabled when not preparing", () => {
    render(<Body {...baseProps} isPreparingFirmwareUpdate={false} />);

    expect(
      screen.getByRole("button", {
        name: "syncOnboarding.manual.softwareCheckContent.firmwareUpdate.viewUpdateCTA",
      }),
    ).toBeEnabled();
  });
});
