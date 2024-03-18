import { renderHook } from "@testing-library/react-hooks";
import {
  postOnboardingDeviceModelIdSelector,
  walletPostOnboardingEntryPointDismissedSelector,
} from "../reducer";
import { useAllPostOnboardingActionsCompleted } from "./useAllPostOnboardingActionsCompleted";
import { usePostOnboardingEntryPointVisibleOnWallet } from "./usePostOnboardingEntryPointVisibleOnWallet";
import { DeviceModelId } from "@ledgerhq/types-devices";

jest.mock("react-redux", () => ({
  useSelector: fun => fun(),
}));
jest.mock("../reducer");
jest.mock("./useAllPostOnboardingActionsCompleted");

const mockedUseAllCompleted = jest.mocked(useAllPostOnboardingActionsCompleted);
const mockedDismissedSelector = jest.mocked(walletPostOnboardingEntryPointDismissedSelector);
const mockedDeviceModelIdSelector = jest.mocked(postOnboardingDeviceModelIdSelector);

describe("usePostOnboardingEntryPointVisibleOnWallet", () => {
  beforeEach(() => {
    mockedUseAllCompleted.mockClear();
    mockedDismissedSelector.mockClear();
    mockedDeviceModelIdSelector.mockClear();
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
});
