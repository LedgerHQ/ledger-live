import React from "react";
import { DeviceModelId } from "@ledgerhq/devices";
import { render, screen } from "tests/testSetup";
import Tutorial, { ScreenId } from "../index";
import { OnboardingUseCase } from "../../../OnboardingUseCase";

jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
  trackPage: jest.fn(),
}));

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

// Quiz popin is an incidental modal that pulls a heavy lib bundle; not under test here.
jest.mock("~/renderer/modals/OnboardingQuizz/OnboardingQuizzModal", () => ({
  QuizzPopin: () => null,
}));

const SECURE_YOUR_CRYPTO_STEP = "Secure your crypto";

const renderTutorial = (useCase: OnboardingUseCase, screenId: ScreenId) =>
  render(<Tutorial useCase={useCase} deviceModelId={DeviceModelId.nanoX} />, {
    initialRoute: `/${screenId}`,
  });

describe("Tutorial onboarding steps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should include the secure-your-crypto step when the use case is setup-device", () => {
    renderTutorial(OnboardingUseCase.setupDevice, ScreenId.secureYourCrypto);

    expect(screen.getByTestId("v3-tutorial-continue")).toBeVisible();
    expect(screen.getAllByText(SECURE_YOUR_CRYPTO_STEP)[0]).toBeVisible();
  });

  it("should not include the secure-your-crypto step when the use case is recovery-phrase", () => {
    renderTutorial(OnboardingUseCase.recoveryPhrase, ScreenId.pinCode);

    expect(screen.getByTestId("v3-tutorial-continue")).toBeVisible();
    expect(screen.queryByText(SECURE_YOUR_CRYPTO_STEP)).not.toBeInTheDocument();
  });
});
