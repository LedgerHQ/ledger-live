import { AuthorizeStatus, OnboardStatus } from "@ledgerhq/coin-canton/types";
import { render, renderHook, screen } from "@tests/test-renderer";
import React from "react";
import { ContentSection } from "../components/ContentSection";
import {
  getStatusTranslationKey,
  useContentSectionViewModel,
} from "../hooks/useContentSectionViewModel";
import { createMockAccount, createMockAccountsProps, createMockStatus } from "./test-utils";

describe("ContentSection", () => {
  const mockAccounts = [createMockAccount({ id: "account-1" })];
  const mockOnRetry = jest.fn();
  const defaultAccounts = createMockAccountsProps(mockAccounts, { selectedIds: ["account-1"] });

  const renderContentSection = (
    status: ReturnType<typeof createMockStatus>,
    accounts: ReturnType<typeof createMockAccountsProps>,
    error: Error | null,
  ) => {
    const { result } = renderHook(() =>
      useContentSectionViewModel({
        status,
        isReonboarding: accounts.isReonboarding,
        error,
      }),
    );

    return render(
      <ContentSection
        isProcessing={status.isProcessing}
        accounts={accounts.toDisplay}
        selectedIds={accounts.selectedIds}
        isReonboarding={accounts.isReonboarding}
        error={error}
        onRetry={mockOnRetry}
        displayStatus={result.current.displayStatus}
        showError={result.current.showError}
        successKey={result.current.successKey}
        statusTranslationKey={result.current.statusTranslationKey}
      />,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with initial status", () => {
    renderContentSection(createMockStatus(), defaultAccounts, null);

    expect(screen.getByTestId("onboard-header-title")).toBeDefined();
  });

  it("should show reonboarding warning when isReonboarding is true", () => {
    renderContentSection(
      createMockStatus(),
      createMockAccountsProps(mockAccounts, { isReonboarding: true }),
      null,
    );

    expect(screen.getByText("Topology Change Detected")).toBeDefined();
  });

  it("should show success alert for SUCCESS status", () => {
    const { toJSON } = renderContentSection(
      createMockStatus({ onboarding: OnboardStatus.SUCCESS }),
      defaultAccounts,
      null,
    );

    const jsonOutput = JSON.stringify(toJSON());
    expect(jsonOutput).toContain("Account onboarded successfully");
  });

  it("should show error section when error occurs", () => {
    const testError = new Error("Onboarding failed");
    renderContentSection(
      createMockStatus({ onboarding: OnboardStatus.ERROR }),
      defaultAccounts,
      testError,
    );

    expect(screen.getByText("Error")).toBeDefined();
  });

  it("should show loading indicator for processing status", () => {
    renderContentSection(
      createMockStatus({ onboarding: OnboardStatus.PREPARE }),
      defaultAccounts,
      null,
    );

    expect(screen.getByText(/Preparing account onboarding transaction/i)).toBeDefined();
  });

  it("should show authorization status when hasResult is true", () => {
    renderContentSection(
      createMockStatus({
        onboarding: OnboardStatus.SUCCESS,
        authorize: AuthorizeStatus.PREPARE,
        hasResult: true,
      }),
      defaultAccounts,
      null,
    );

    expect(screen.getByText("Preparing authorization...")).toBeDefined();
  });
});

describe("getStatusTranslationKey", () => {
  it("should return correct translation keys for onboarding statuses", () => {
    expect(getStatusTranslationKey(OnboardStatus.PREPARE, false)).toBe(
      "canton.onboard.status.prepare",
    );
    expect(getStatusTranslationKey(OnboardStatus.SUBMIT, false)).toBe(
      "canton.onboard.status.submit",
    );
    expect(getStatusTranslationKey(OnboardStatus.INIT, false)).toBe(
      "canton.onboard.status.default",
    );
  });

  it("should return correct translation keys for authorization statuses", () => {
    expect(getStatusTranslationKey(AuthorizeStatus.PREPARE, true)).toBe(
      "canton.authorize.status.prepare",
    );
    expect(getStatusTranslationKey(AuthorizeStatus.SUBMIT, true)).toBe(
      "canton.authorize.status.submit",
    );
    expect(getStatusTranslationKey(AuthorizeStatus.INIT, true)).toBe(
      "canton.authorize.status.default",
    );
  });
});

describe("useContentSectionViewModel", () => {
  it("should compute isAuthorizationPhase correctly", () => {
    const { result } = renderHook(() =>
      useContentSectionViewModel({
        status: createMockStatus({ hasResult: true, onboarding: OnboardStatus.SUCCESS }),
        isReonboarding: false,
        error: null,
      }),
    );

    expect(result.current.isAuthorizationPhase).toBe(true);
  });

  it("should not set isAuthorizationPhase when onboarding is ERROR", () => {
    const { result } = renderHook(() =>
      useContentSectionViewModel({
        status: createMockStatus({ hasResult: true, onboarding: OnboardStatus.ERROR }),
        isReonboarding: false,
        error: null,
      }),
    );

    expect(result.current.isAuthorizationPhase).toBe(false);
  });

  it("should return onboarding status when not in authorization phase", () => {
    const { result } = renderHook(() =>
      useContentSectionViewModel({
        status: createMockStatus({ onboarding: OnboardStatus.PREPARE, hasResult: false }),
        isReonboarding: false,
        error: null,
      }),
    );

    expect(result.current.displayStatus).toBe(OnboardStatus.PREPARE);
  });

  it("should return authorize status when in authorization phase", () => {
    const { result } = renderHook(() =>
      useContentSectionViewModel({
        status: createMockStatus({
          onboarding: OnboardStatus.SUCCESS,
          authorize: AuthorizeStatus.PREPARE,
          hasResult: true,
        }),
        isReonboarding: false,
        error: null,
      }),
    );

    expect(result.current.displayStatus).toBe(AuthorizeStatus.PREPARE);
  });

  it("should compute showError correctly for onboarding error", () => {
    const error = new Error("Test error");
    const { result } = renderHook(() =>
      useContentSectionViewModel({
        status: createMockStatus({ onboarding: OnboardStatus.ERROR }),
        isReonboarding: false,
        error,
      }),
    );

    expect(result.current.showError).toBe(true);
  });

  it("should compute showError correctly for authorization error", () => {
    const error = new Error("Test error");
    const { result } = renderHook(() =>
      useContentSectionViewModel({
        status: createMockStatus({
          onboarding: OnboardStatus.SUCCESS,
          authorize: AuthorizeStatus.ERROR,
          hasResult: true,
        }),
        isReonboarding: false,
        error,
      }),
    );

    expect(result.current.showError).toBe(true);
  });

  it("should not show error when no error exists", () => {
    const { result } = renderHook(() =>
      useContentSectionViewModel({
        status: createMockStatus(),
        isReonboarding: false,
        error: null,
      }),
    );

    expect(result.current.showError).toBe(false);
  });

  it("should return reonboarding success key when isReonboarding is true", () => {
    const { result } = renderHook(() =>
      useContentSectionViewModel({
        status: createMockStatus(),
        isReonboarding: true,
        error: null,
      }),
    );

    expect(result.current.successKey).toBe("canton.onboard.reonboard.success");
  });

  it("should return regular success key when isReonboarding is false", () => {
    const { result } = renderHook(() =>
      useContentSectionViewModel({
        status: createMockStatus(),
        isReonboarding: false,
        error: null,
      }),
    );

    expect(result.current.successKey).toBe("canton.onboard.success");
  });
});
