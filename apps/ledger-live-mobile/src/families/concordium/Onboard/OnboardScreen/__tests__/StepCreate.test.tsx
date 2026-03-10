import React from "react";
import { render, screen, userEvent } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import StepCreate from "../components/StepCreate";
import { CreateStatus } from "../hooks/useOnboarding";

const mockStartOnboarding = jest.fn();
const mockUseOnboarding = jest.fn();

jest.mock("../hooks/useOnboarding", () => ({
  ...jest.requireActual("../hooks/useOnboarding"),
  useOnboarding: (...args: unknown[]) => mockUseOnboarding(...args),
}));

const currency = getCryptoCurrencyById("concordium");
const creatableAccount = genAccount("concordium-1", { currency });
const sessionTopic = "ABCD1234sessiontopic";
const onCreated = jest.fn();
const onSessionExpired = jest.fn();

const setupMock = (overrides: { createStatus: CreateStatus; confirmationCode?: string }) => {
  mockUseOnboarding.mockReturnValue({
    createStatus: overrides.createStatus,
    confirmationCode: overrides.confirmationCode ?? "ABCD",
    startOnboarding: mockStartOnboarding,
  });
};

const renderStepCreate = () =>
  render(
    <StepCreate
      currency={currency}
      deviceId="device-id"
      creatableAccount={creatableAccount}
      accountName="Concordium 1"
      sessionTopic={sessionTopic}
      onCreated={onCreated}
      onSessionExpired={onSessionExpired}
    />,
  );

describe("StepCreate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show confirmation code and account name in PREPARING state", () => {
    setupMock({ createStatus: CreateStatus.PREPARING, confirmationCode: "ABCD" });
    renderStepCreate();

    expect(screen.getByText("A")).toBeDefined();
    expect(screen.getByText("B")).toBeDefined();
    expect(screen.getByText("C")).toBeDefined();
    expect(screen.getByText("D")).toBeDefined();
    expect(
      screen.getByText("To create an account, match the code below in the Concordium ID App"),
    ).toBeDefined();
    expect(screen.getByText("Concordium 1")).toBeDefined();
  });

  it("should show loading state in SUBMITTING state", () => {
    setupMock({ createStatus: CreateStatus.SUBMITTING });
    renderStepCreate();

    expect(
      screen.getByText("Approve the transaction on your Ledger device. Keep your Ledger nearby."),
    ).toBeDefined();
  });

  it("should show success alert in SUCCESS state", () => {
    setupMock({ createStatus: CreateStatus.SUCCESS });
    renderStepCreate();

    expect(
      screen.getByText("Your Concordium account has been created successfully."),
    ).toBeDefined();
  });

  it("should show error alert with retry button in ERROR state", () => {
    setupMock({ createStatus: CreateStatus.ERROR });
    renderStepCreate();

    expect(screen.getByText("Failed to create account. Please try again.")).toBeDefined();
    expect(screen.getByText("Retry")).toBeDefined();
  });

  it("should call startOnboarding on retry", async () => {
    setupMock({ createStatus: CreateStatus.ERROR });
    renderStepCreate();

    await userEvent.press(screen.getByText("Retry"));

    expect(mockStartOnboarding).toHaveBeenCalledTimes(1);
  });
});
