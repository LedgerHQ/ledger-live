import { renderHook } from "@testing-library/react";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useWrongDeviceForAccountViewModel } from "./useWrongDeviceForAccountViewModel";

jest.mock("../../hooks/useInitializerActions", () => ({
  useInitializerActions: jest.fn(),
}));

const mockedUseInitializerActions = jest.mocked(useInitializerActions);
const openSupport = jest.fn();

describe("useWrongDeviceForAccountViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding: jest.fn(),
      openSupport,
    });
  });

  it("GIVEN a wrong device state WHEN calling onCancel THEN it cancels", () => {
    // GIVEN
    const onCancel = jest.fn();
    const { result } = renderHook(() => useWrongDeviceForAccountViewModel({ onCancel }));

    // WHEN
    result.current.onCancel();

    // THEN
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a wrong device state WHEN calling onContactSupport THEN it opens support", () => {
    // GIVEN
    const { result } = renderHook(() => useWrongDeviceForAccountViewModel({ onCancel: jest.fn() }));

    // WHEN
    result.current.onContactSupport();

    // THEN
    expect(openSupport).toHaveBeenCalledTimes(1);
  });
});
