import { renderHook } from "@testing-library/react";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useUnsupportedFeatureViewModel } from "./useUnsupportedFeatureViewModel";

jest.mock("../../hooks/useInitializerActions", () => ({
  useInitializerActions: jest.fn(),
}));

const mockedUseInitializerActions = jest.mocked(useInitializerActions);
const openSupport = jest.fn();

describe("useUnsupportedFeatureViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding: jest.fn(),
      openSupport,
    });
  });

  it("GIVEN an unsupported feature state WHEN contacting support THEN it opens support", () => {
    // GIVEN
    const { result } = renderHook(() => useUnsupportedFeatureViewModel());

    // WHEN
    result.current.onContactSupport();

    // THEN
    expect(openSupport).toHaveBeenCalledTimes(1);
  });
});
