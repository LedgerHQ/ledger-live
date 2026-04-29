/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { entryPointFirstDisplayedDateSelector } from "../reducer";
import { usePostOnboardingEntryPointVisibleOnWallet } from "./usePostOnboardingEntryPointVisibleOnWallet";
import { useAutoDismissPostOnboardingEntryPoint } from "./useAutoDismissPostOnboardingEntryPoint";

const mockedDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useSelector: fun => fun(),
  useDispatch: () => mockedDispatch,
}));
jest.mock("../reducer");
jest.mock("./usePostOnboardingEntryPointVisibleOnWallet");

const mockedUsePostOnboardingVisible = jest.mocked(usePostOnboardingEntryPointVisibleOnWallet);
const mockedEntryPointFirstDisplayedDateSelector = jest.mocked(
  entryPointFirstDisplayedDateSelector,
);

describe("useAutoDismissPostOnboardingEntryPoint", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-20"));
  });

  afterAll(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockedEntryPointFirstDisplayedDateSelector.mockClear();
    mockedUsePostOnboardingVisible.mockClear();
    mockedDispatch.mockClear();
  });

  it("should dismiss the entry point when first display is past the auto-dismiss window", () => {
    mockedUsePostOnboardingVisible.mockReturnValue(true);
    mockedEntryPointFirstDisplayedDateSelector.mockReturnValue(new Date("2020-01-04"));

    renderHook(() => useAutoDismissPostOnboardingEntryPoint());

    expect(mockedDispatch).toHaveBeenCalledWith({
      type: "POST_ONBOARDING_HIDE_WALLET_ENTRY_POINT",
    });
  });

  it("should not dismiss when first display is still inside the auto-dismiss window", () => {
    mockedUsePostOnboardingVisible.mockReturnValue(true);
    mockedEntryPointFirstDisplayedDateSelector.mockReturnValue(new Date("2020-01-06"));

    renderHook(() => useAutoDismissPostOnboardingEntryPoint());

    expect(mockedDispatch).not.toHaveBeenCalled();
  });
});
