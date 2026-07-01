/**
 * @jest-environment jsdom
 */
import { setPostOnboardingDate } from "@ledgerhq/live-common/postOnboarding/actions";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { renderHook } from "@testing-library/react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";
import { useBackfillOnboardingDate } from "../useBackfillOnboardingDate";

jest.mock("LLD/hooks/redux");
jest.mock("@ledgerhq/live-common/postOnboarding/actions", () => ({
  setPostOnboardingDate: ({ onboardingDate }: { onboardingDate: Date | null }) => ({
    type: "POST_ONBOARDING_SET_ONBOARDING_DATE",
    payload: { onboardingDate },
  }),
}));

const mockedUseDispatch = jest.mocked(useDispatch);
const mockedUseSelector = jest.mocked(useSelector);

const mockDispatch = jest.fn();
const now = new Date("2026-01-02T03:04:05.000Z");

const setSelectorValues = ({
  hasCompletedOnboarding,
  onboardingDate,
}: {
  hasCompletedOnboarding: boolean;
  onboardingDate: Date | null;
}) => {
  mockedUseSelector.mockImplementation((selector: unknown) => {
    if (selector === hasCompletedOnboardingSelector) return hasCompletedOnboarding;
    if (selector === onboardingDateSelector) return onboardingDate;
    return undefined;
  });
};

describe("useBackfillOnboardingDate", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    jest.clearAllMocks();
    mockedUseDispatch.mockReturnValue(mockDispatch);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should backfill the onboarding date for legacy users who completed onboarding", () => {
    setSelectorValues({ hasCompletedOnboarding: true, onboardingDate: null });

    renderHook(() => useBackfillOnboardingDate());

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(setPostOnboardingDate({ onboardingDate: now }));
  });

  it("should not backfill when onboarding is not completed", () => {
    setSelectorValues({ hasCompletedOnboarding: false, onboardingDate: null });

    renderHook(() => useBackfillOnboardingDate());

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("should not backfill when an onboarding date already exists", () => {
    setSelectorValues({ hasCompletedOnboarding: true, onboardingDate: now });

    renderHook(() => useBackfillOnboardingDate());

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
