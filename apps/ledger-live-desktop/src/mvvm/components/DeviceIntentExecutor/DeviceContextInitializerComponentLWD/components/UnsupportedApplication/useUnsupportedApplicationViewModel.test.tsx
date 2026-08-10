import { renderHook } from "@testing-library/react";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useUnsupportedApplicationViewModel } from "./useUnsupportedApplicationViewModel";

jest.mock("../../hooks/useInitializerActions", () => ({
  useInitializerActions: jest.fn(),
}));

const mockedUseInitializerActions = jest.mocked(useInitializerActions);
const openSupport = jest.fn();

describe("useUnsupportedApplicationViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding: jest.fn(),
      openSupport,
    });
  });

  it("GIVEN an unsupported application state WHEN contacting support THEN it opens support", () => {
    // GIVEN
    const { result } = renderHook(() => useUnsupportedApplicationViewModel());

    // WHEN
    result.current.onContactSupport();

    // THEN
    expect(openSupport).toHaveBeenCalledTimes(1);
  });
});
