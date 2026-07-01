import { renderHook } from "@testing-library/react";
import { AppInteractionRequiredStateType } from "@ledgerhq/live-dmk-shared";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useOutdatedAppWarningViewModel } from "./useOutdatedAppWarningViewModel";

jest.mock("../../hooks/useInitializerActions", () => ({
  useInitializerActions: jest.fn(),
}));

const mockedUseInitializerActions = jest.mocked(useInitializerActions);
const openMyLedger = jest.fn();

describe("useOutdatedAppWarningViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger,
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding: jest.fn(),
      openSupport: jest.fn(),
    });
  });

  const renderViewModel = (onContinue = jest.fn()) =>
    renderHook(() =>
      useOutdatedAppWarningViewModel({
        state: {
          type: AppInteractionRequiredStateType.OutdatedAppWarning,
          appName: "Ethereum",
          onContinue,
        },
      }),
    );

  it("GIVEN an outdated app warning WHEN rendering THEN it exposes the app name", () => {
    // GIVEN
    const { result } = renderViewModel();

    // THEN
    expect(result.current.appName).toBe("Ethereum");
  });

  it("GIVEN an outdated app warning WHEN calling onOpenMyLedger THEN it opens Manager for the app", () => {
    // GIVEN
    const { result } = renderViewModel();

    // WHEN
    result.current.onOpenMyLedger();

    // THEN
    expect(openMyLedger).toHaveBeenCalledWith("Ethereum");
  });

  it("GIVEN an outdated app warning WHEN calling onContinue THEN it preserves continue", () => {
    // GIVEN
    const onContinue = jest.fn();
    const { result } = renderViewModel(onContinue);

    // WHEN
    result.current.onContinue();

    // THEN
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
