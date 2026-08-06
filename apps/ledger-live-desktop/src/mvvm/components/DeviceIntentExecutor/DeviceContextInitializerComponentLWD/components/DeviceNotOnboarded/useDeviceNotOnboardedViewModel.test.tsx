import { renderHook } from "@testing-library/react";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { initializerDevice } from "../../testUtils";
import { useDeviceNotOnboardedViewModel } from "./useDeviceNotOnboardedViewModel";

jest.mock("../../hooks/useInitializerActions", () => ({
  useInitializerActions: jest.fn(),
}));

const mockedUseInitializerActions = jest.mocked(useInitializerActions);
const openOnboarding = jest.fn();

describe("useDeviceNotOnboardedViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding,
      openSupport: jest.fn(),
    });
  });

  it("GIVEN a not onboarded device WHEN rendering THEN it exposes the product name", () => {
    // GIVEN
    const { result } = renderHook(() =>
      useDeviceNotOnboardedViewModel({ device: initializerDevice }),
    );

    // THEN
    expect(result.current.productName).toBe("Ledger Nano X");
  });

  it("GIVEN a not onboarded device WHEN setting up device THEN it opens onboarding", () => {
    // GIVEN
    const { result } = renderHook(() =>
      useDeviceNotOnboardedViewModel({ device: initializerDevice }),
    );

    // WHEN
    result.current.onSetupDevice();

    // THEN
    expect(openOnboarding).toHaveBeenCalledTimes(1);
  });
});
