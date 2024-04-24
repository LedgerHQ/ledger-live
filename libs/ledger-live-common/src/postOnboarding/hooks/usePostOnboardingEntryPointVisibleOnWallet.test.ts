/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import {
  postOnboardingDeviceModelIdSelector,
  walletPostOnboardingEntryPointDismissedSelector,
  entryPointFirstDisplayedDateSelector,
} from "../reducer";
import { useAllPostOnboardingActionsCompleted } from "./useAllPostOnboardingActionsCompleted";
import { usePostOnboardingEntryPointVisibleOnWallet } from "./usePostOnboardingEntryPointVisibleOnWallet";
import { DeviceModelId } from "@ledgerhq/types-devices";

const mockedDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useSelector: fun => fun(),
  useDispatch: () => mockedDispatch,
}));
jest.mock("../reducer");
jest.mock("./useAllPostOnboardingActionsCompleted");

const mockedUseAllCompleted = jest.mocked(useAllPostOnboardingActionsCompleted);
const mockedDismissedSelector = jest.mocked(walletPostOnboardingEntryPointDismissedSelector);
const mockedDeviceModelIdSelector = jest.mocked(postOnboardingDeviceModelIdSelector);
const mockedEntryPointFirstDisplayedDateSelector = jest.mocked(
  entryPointFirstDisplayedDateSelector,
);

describe("usePostOnboardingEntryPointVisibleOnWallet", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-20"));
  });

  afterAll(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockedUseAllCompleted.mockClear();
    mockedDismissedSelector.mockClear();
    mockedDeviceModelIdSelector.mockClear();
    mockedDispatch.mockClear();
  });

  it("should be false if deviceModelId is null", () => {
    mockedUseAllCompleted.mockReturnValue(false);
    mockedDismissedSelector.mockReturnValue(false);
    mockedDeviceModelIdSelector.mockReturnValue(null);

    const { result } = renderHook(() => usePostOnboardingEntryPointVisibleOnWallet());

    expect(result.current).toBe(false);
  });

  it("should be false if the the entry point HAS been dismissed", () => {
    mockedDismissedSelector.mockReturnValue(true);
    mockedDeviceModelIdSelector.mockReturnValue(DeviceModelId.nanoX);

    mockedUseAllCompleted.mockReturnValue(false);
    const { result: res1 } = renderHook(() => usePostOnboardingEntryPointVisibleOnWallet());
    expect(res1.current).toBe(false);

    mockedUseAllCompleted.mockReturnValue(true);
    const { result: res2 } = renderHook(() => usePostOnboardingEntryPointVisibleOnWallet());
    expect(res2.current).toBe(false);
  });

  it("should be false if all actions are completed", () => {
    mockedDismissedSelector.mockReturnValue(false);
    mockedUseAllCompleted.mockReturnValue(true);

    mockedDeviceModelIdSelector.mockReturnValue(DeviceModelId.nanoX);
    const { result } = renderHook(() => usePostOnboardingEntryPointVisibleOnWallet());

    expect(result.current).toBe(false);
  });

  it("should be true if the entry point HAS NOT been dismissed and all actions are NOT completed", () => {
    mockedDismissedSelector.mockReturnValue(false);
    mockedUseAllCompleted.mockReturnValue(false);
    mockedDeviceModelIdSelector.mockReturnValue(DeviceModelId.nanoX);

    const { result } = renderHook(() => usePostOnboardingEntryPointVisibleOnWallet());

    expect(result.current).toBe(true);
  });

  it("should dismiss the entry point if it has been displayed more than 7 days ago", () => {
    mockedDismissedSelector.mockReturnValue(false);
    mockedUseAllCompleted.mockReturnValue(false);
    mockedDeviceModelIdSelector.mockReturnValue(DeviceModelId.nanoX);
    mockedEntryPointFirstDisplayedDateSelector.mockReturnValue(new Date("2020-01-12"));

    renderHook(() => usePostOnboardingEntryPointVisibleOnWallet());

    expect(mockedDispatch).toHaveBeenCalledWith({
      type: "POST_ONBOARDING_HIDE_WALLET_ENTRY_POINT",
    });
  });

  it("should be true if the entry point has been displayed less than 7 days ago", () => {
    mockedDismissedSelector.mockReturnValue(false);
    mockedUseAllCompleted.mockReturnValue(false);
    mockedDeviceModelIdSelector.mockReturnValue(DeviceModelId.nanoX);
    mockedEntryPointFirstDisplayedDateSelector.mockReturnValue(new Date("2020-01-14"));

    const { result } = renderHook(() => usePostOnboardingEntryPointVisibleOnWallet());

    expect(result.current).toBe(true);
    expect(mockedDispatch).not.toHaveBeenCalled();
  });
});
