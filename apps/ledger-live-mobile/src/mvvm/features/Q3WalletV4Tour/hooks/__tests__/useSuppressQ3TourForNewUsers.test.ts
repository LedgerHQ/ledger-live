import { renderHook } from "@testing-library/react-native";
import { useFeature } from "@features/platform-feature-flags";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasSeenQ3WalletV4Tour } from "~/actions/settings";
import { useSuppressQ3TourForNewUsers } from "../useSuppressQ3TourForNewUsers";

jest.mock("@features/platform-feature-flags");
jest.mock("~/context/hooks", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);
const mockUseDispatch = jest.mocked(useDispatch);
const mockUseFeature = jest.mocked(useFeature);
const dispatch = jest.fn();

function mockState({
  hasCompletedOnboarding,
  hasSeenQ3WalletV4Tour,
}: {
  hasCompletedOnboarding: boolean;
  hasSeenQ3WalletV4Tour: boolean;
}) {
  const state = { settings: { hasCompletedOnboarding, hasSeenQ3WalletV4Tour } };
  mockUseSelector.mockImplementation(selector => selector(state as never));
}

function mockTourEnabled(enabled: boolean) {
  mockUseFeature.mockReturnValue({
    enabled,
    params: { variant: enabled ? "q3_a" : undefined },
  } as never);
}

describe("useSuppressQ3TourForNewUsers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDispatch.mockReturnValue(dispatch);
    mockTourEnabled(true);
  });

  it("marks the tour as seen when the app opens enabled and the user is not onboarded", () => {
    mockState({ hasCompletedOnboarding: false, hasSeenQ3WalletV4Tour: false });

    renderHook(() => useSuppressQ3TourForNewUsers());

    expect(dispatch).toHaveBeenCalledWith(setHasSeenQ3WalletV4Tour(true));
  });

  it("marks the tour as seen when the flag turns on after mount for a not-onboarded user", () => {
    mockTourEnabled(false);
    mockState({ hasCompletedOnboarding: false, hasSeenQ3WalletV4Tour: false });

    const { rerender } = renderHook(() => useSuppressQ3TourForNewUsers());
    expect(dispatch).not.toHaveBeenCalled();

    mockTourEnabled(true);
    rerender({});

    expect(dispatch).toHaveBeenCalledWith(setHasSeenQ3WalletV4Tour(true));
  });

  it("does nothing when the tour feature is disabled", () => {
    mockTourEnabled(false);
    mockState({ hasCompletedOnboarding: false, hasSeenQ3WalletV4Tour: false });

    renderHook(() => useSuppressQ3TourForNewUsers());

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does nothing for an already-onboarded user", () => {
    mockState({ hasCompletedOnboarding: true, hasSeenQ3WalletV4Tour: false });

    renderHook(() => useSuppressQ3TourForNewUsers());

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does nothing if the tour was already seen", () => {
    mockState({ hasCompletedOnboarding: false, hasSeenQ3WalletV4Tour: true });

    renderHook(() => useSuppressQ3TourForNewUsers());

    expect(dispatch).not.toHaveBeenCalled();
  });
});
