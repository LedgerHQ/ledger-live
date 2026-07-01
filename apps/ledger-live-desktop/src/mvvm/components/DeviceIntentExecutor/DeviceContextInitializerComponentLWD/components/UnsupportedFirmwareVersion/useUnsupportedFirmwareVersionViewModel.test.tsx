import { renderHook } from "@testing-library/react";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useUnsupportedFirmwareVersionViewModel } from "./useUnsupportedFirmwareVersionViewModel";

jest.mock("../../hooks/useInitializerActions", () => ({
  useInitializerActions: jest.fn(),
}));

const mockedUseInitializerActions = jest.mocked(useInitializerActions);
const openMyLedgerFirmwareUpdate = jest.fn();

describe("useUnsupportedFirmwareVersionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate,
      openOnboarding: jest.fn(),
      openSupport: jest.fn(),
    });
  });

  it("GIVEN an unsupported firmware state WHEN calling onUpdateLedgerOs THEN it opens the firmware update", () => {
    // GIVEN
    const { result } = renderHook(() =>
      useUnsupportedFirmwareVersionViewModel({ onCancel: jest.fn() }),
    );

    // WHEN
    result.current.onUpdateLedgerOs();

    // THEN
    expect(openMyLedgerFirmwareUpdate).toHaveBeenCalledTimes(1);
  });

  it("GIVEN an unsupported firmware state WHEN calling onCancel THEN it preserves cancel", () => {
    // GIVEN
    const onCancel = jest.fn();
    const { result } = renderHook(() => useUnsupportedFirmwareVersionViewModel({ onCancel }));

    // WHEN
    result.current.onCancel();

    // THEN
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
