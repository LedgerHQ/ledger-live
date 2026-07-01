/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { setPostOnboardingDate } from "@ledgerhq/live-common/postOnboarding/actions";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import PostOnboardingHubTester from "./PostOnboardingHubTester";

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
const mockStartPostOnboarding = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index", () => ({
  useStartPostOnboardingCallback: () => mockStartPostOnboarding,
}));

jest.mock("@ledgerhq/live-common/postOnboarding/actions", () => ({
  setPostOnboardingDate: ({ onboardingDate }: { onboardingDate: Date | null }) => ({
    type: "POST_ONBOARDING_SET_ONBOARDING_DATE",
    payload: { onboardingDate },
  }),
}));

jest.mock("~/renderer/screens/settings/SettingsSection", () => ({
  SettingsSectionRow: ({
    title,
    desc,
    children,
  }: {
    title: string;
    desc?: string;
    children: React.ReactNode;
  }) => (
    <section>
      <h2>{title}</h2>
      {desc ? <p>{desc}</p> : null}
      {children}
    </section>
  ),
}));

jest.mock("@ledgerhq/lumen-ui-react", () => ({
  Button: ({
    children,
    onClick,
    "data-testid": dataTestId,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    "data-testid"?: string;
  }) => (
    <button data-testid={dataTestId} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock("@ledgerhq/react-ui", () => ({
  Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("LLD/hooks/redux");

const mockedUseDispatch = jest.mocked(useDispatch);
const mockedUseSelector = jest.mocked(useSelector);

const now = new Date("2026-01-02T03:04:05.000Z");

describe("PostOnboardingHubTester", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    jest.clearAllMocks();
    mockedUseDispatch.mockReturnValue(mockDispatch);
    mockedUseSelector.mockImplementation((selector: unknown) => {
      if (selector === onboardingDateSelector) return null;
      return undefined;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should show a null onboarding date when no date is persisted", () => {
    render(<PostOnboardingHubTester />);

    expect(screen.getByText("Current: null")).toBeInTheDocument();
  });

  it("should show the current onboarding date when one is persisted", () => {
    const persistedDate = new Date("2024-03-04T05:06:07.000Z");
    mockedUseSelector.mockImplementation((selector: unknown) => {
      if (selector === onboardingDateSelector) return persistedDate;
      return undefined;
    });

    render(<PostOnboardingHubTester />);

    expect(screen.getByText("Current: 2024-03-04T05:06:07.000Z")).toBeInTheDocument();
  });

  it("should set and reset the onboarding date from the debug actions", () => {
    render(<PostOnboardingHubTester />);

    fireEvent.click(screen.getByText("Set to today"));
    expect(mockDispatch).toHaveBeenCalledWith(setPostOnboardingDate({ onboardingDate: now }));

    fireEvent.click(screen.getByText("Reset to null"));
    expect(mockDispatch).toHaveBeenCalledWith(setPostOnboardingDate({ onboardingDate: null }));
  });
});
