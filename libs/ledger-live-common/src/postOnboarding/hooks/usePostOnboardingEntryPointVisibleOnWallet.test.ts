import { renderHook } from "@testing-library/react-hooks";
import { walletPostOnboardingEntryPointDismissedSelector } from "../reducer";
import { useAllPostOnboardingActionsCompleted } from "./useAllPostOnboardingActionsCompleted";
import { usePostOnboardingEntryPointVisibleOnWallet } from "./usePostOnboardingEntryPointVisibleOnWallet";
import { usePostOnboardingDeviceModelId } from "./usePostOnboardingDeviceModelId";
import { DeviceModelId } from "@ledgerhq/types-devices";

jest.mock("react-redux", () => ({
  useSelector: (fun) => fun(),
}));
jest.mock("../reducer");
jest.mock("./useAllPostOnboardingActionsCompleted");
jest.mock("./usePostOnboardingDeviceModelId");

const mockedUseAllCompleted = jest.mocked(useAllPostOnboardingActionsCompleted);
const mockedDismissedSelector = jest.mocked(
  walletPostOnboardingEntryPointDismissedSelector
);
const mockedUseDeviceModelId = jest.mocked(usePostOnboardingDeviceModelId);

describe("usePostOnboardingEntryPointVisibleOnWallet", () => {
  beforeEach(() => {
    mockedUseAllCompleted.mockClear();
    mockedDismissedSelector.mockClear();
    mockedUseDeviceModelId.mockClear();
  });
  it("should be false if deviceModelId is null", () => {
    mockedUseAllCompleted.mockReturnValue(false);
    mockedDismissedSelector.mockReturnValue(false);
    mockedUseDeviceModelId.mockReturnValue(null);
  });
  it("should be false if the the entry point HAS been dismissed", () => {
    mockedDismissedSelector.mockReturnValue(true);
    mockedUseAllCompleted.mockReturnValueOnce(false).mockReturnValueOnce(true);
    mockedUseDeviceModelId.mockReturnValue(DeviceModelId.nanoX);
    const { result: res1 } = renderHook(() =>
      usePostOnboardingEntryPointVisibleOnWallet()
    );
    const { result: res2 } = renderHook(() =>
      usePostOnboardingEntryPointVisibleOnWallet()
    );
    expect(res1.current).toBe(false);
    expect(res2.current).toBe(false);
  });
  it("should be false if all actions are completed", () => {
    mockedDismissedSelector.mockReturnValue(false);
    mockedUseAllCompleted.mockReturnValue(true);
    mockedUseDeviceModelId.mockReturnValue(DeviceModelId.nanoX);
    const { result } = renderHook(() =>
      usePostOnboardingEntryPointVisibleOnWallet()
    );
    expect(result.current).toBe(false);
  });
  it("should be true if the entry point HAS NOT been dismissed and all actions are NOT completed", () => {
    mockedDismissedSelector.mockReturnValue(false);
    mockedUseAllCompleted.mockReturnValue(false);
    mockedUseDeviceModelId.mockReturnValue(DeviceModelId.nanoX);
    const { result } = renderHook(() =>
      usePostOnboardingEntryPointVisibleOnWallet()
    );
    expect(result.current).toBe(true);
  });
});
