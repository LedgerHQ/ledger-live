import { renderHook } from "@testing-library/react-native";
import { useFeature } from "@features/platform-feature-flags";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasSeenQ2WalletV4Tour } from "~/actions/settings";
import { useSuppressQ2TourForNewUsers } from "../useSuppressQ2TourForNewUsers";

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
  hasSeenQ2WalletV4Tour,
}: {
  hasCompletedOnboarding: boolean;
  hasSeenQ2WalletV4Tour: boolean;
}) {
  const state = { settings: { hasCompletedOnboarding, hasSeenQ2WalletV4Tour } };
  mockUseSelector.mockImplementation(selector => selector(state as never));
}

function mockTourEnabled(enabled: boolean) {
  mockUseFeature.mockReturnValue({ enabled, params: { q2Tour: enabled } } as never);
}

describe("useSuppressQ2TourForNewUsers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDispatch.mockReturnValue(dispatch);
    mockTourEnabled(true);
  });

  it("marks the tour as seen when the app opens enabled and the user is not onboarded", () => {
    mockState({ hasCompletedOnboarding: false, hasSeenQ2WalletV4Tour: false });

    renderHook(() => useSuppressQ2TourForNewUsers());

    expect(dispatch).toHaveBeenCalledWith(setHasSeenQ2WalletV4Tour(true));
  });

  it("marks the tour as seen when the flag turns on after mount for a not-onboarded user", () => {
    mockTourEnabled(false);
    mockState({ hasCompletedOnboarding: false, hasSeenQ2WalletV4Tour: false });

    const { rerender } = renderHook(() => useSuppressQ2TourForNewUsers());
    expect(dispatch).not.toHaveBeenCalled();

    // Flag arrives after mount.
    mockTourEnabled(true);
    rerender({});

    expect(dispatch).toHaveBeenCalledWith(setHasSeenQ2WalletV4Tour(true));
  });

  it("does nothing when the tour feature is disabled", () => {
    mockTourEnabled(false);
    mockState({ hasCompletedOnboarding: false, hasSeenQ2WalletV4Tour: false });

    renderHook(() => useSuppressQ2TourForNewUsers());

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does nothing for an already-onboarded user", () => {
    mockState({ hasCompletedOnboarding: true, hasSeenQ2WalletV4Tour: false });

    renderHook(() => useSuppressQ2TourForNewUsers());

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does nothing if the tour was already seen", () => {
    mockState({ hasCompletedOnboarding: false, hasSeenQ2WalletV4Tour: true });

    renderHook(() => useSuppressQ2TourForNewUsers());

    expect(dispatch).not.toHaveBeenCalled();
  });
});
