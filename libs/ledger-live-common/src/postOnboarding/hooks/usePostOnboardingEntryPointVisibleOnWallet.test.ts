/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import {
  postOnboardingDeviceModelIdSelector,
  walletPostOnboardingEntryPointDismissedSelector,
} from "../reducer";
import { usePostOnboardingEntryPointVisibleOnWallet } from "./usePostOnboardingEntryPointVisibleOnWallet";
import { DeviceModelId } from "@ledgerhq/types-devices";

jest.mock("react-redux", () => ({
  useSelector: fun => fun(),
}));
jest.mock("../reducer");

const mockedDismissedSelector = jest.mocked(walletPostOnboardingEntryPointDismissedSelector);
const mockedDeviceModelIdSelector = jest.mocked(postOnboardingDeviceModelIdSelector);

describe("usePostOnboardingEntryPointVisibleOnWallet", () => {
  beforeEach(() => {
    mockedDismissedSelector.mockClear();
    mockedDeviceModelIdSelector.mockClear();
  });

  it("should be false if deviceModelId is null", () => {
    mockedDismissedSelector.mockReturnValue(false);
    mockedDeviceModelIdSelector.mockReturnValue(null);

    const { result } = renderHook(() => usePostOnboardingEntryPointVisibleOnWallet());

    expect(result.current).toBe(false);
  });

  it("should be false if the entry point has been dismissed", () => {
    mockedDismissedSelector.mockReturnValue(true);
    mockedDeviceModelIdSelector.mockReturnValue(DeviceModelId.nanoX);

    const { result } = renderHook(() => usePostOnboardingEntryPointVisibleOnWallet());
    expect(result.current).toBe(false);
  });

  it("should be true when not dismissed and device is set, regardless of task completion", () => {
    mockedDismissedSelector.mockReturnValue(false);
    mockedDeviceModelIdSelector.mockReturnValue(DeviceModelId.nanoX);

    const { result } = renderHook(() => usePostOnboardingEntryPointVisibleOnWallet());

    expect(result.current).toBe(true);
  });
});
