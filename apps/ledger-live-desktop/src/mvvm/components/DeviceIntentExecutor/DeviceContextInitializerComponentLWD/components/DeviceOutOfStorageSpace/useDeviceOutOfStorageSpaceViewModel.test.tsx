import { renderHook } from "@testing-library/react";
import { BlockingStateType } from "@ledgerhq/live-dmk-shared";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useDeviceOutOfStorageSpaceViewModel } from "./useDeviceOutOfStorageSpaceViewModel";

jest.mock("../../hooks/useInitializerActions", () => ({
  useInitializerActions: jest.fn(),
}));

const mockedUseInitializerActions = jest.mocked(useInitializerActions);
const openMyLedger = jest.fn();

describe("useDeviceOutOfStorageSpaceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger,
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding: jest.fn(),
      openSupport: jest.fn(),
    });
  });

  const renderViewModel = () =>
    renderHook(() =>
      useDeviceOutOfStorageSpaceViewModel({
        state: {
          type: BlockingStateType.DeviceOutOfStorageSpace,
          appNames: ["Ethereum", "Bitcoin"],
        },
      }),
    );

  it("GIVEN multiple apps WHEN rendering THEN it displays all apps", () => {
    // GIVEN
    const { result } = renderViewModel();

    // THEN
    expect(result.current.appNamesText).toBe("Ethereum, Bitcoin");
  });

  it("GIVEN multiple apps WHEN opening My Ledger THEN it searches with all app names", () => {
    // GIVEN
    const { result } = renderViewModel();

    // WHEN
    result.current.onOpenMyLedger();

    // THEN
    expect(openMyLedger).toHaveBeenCalledWith("Ethereum, Bitcoin");
  });
});
