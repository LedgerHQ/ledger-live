import { renderHook } from "@testing-library/react";
import { BlockingStateType, FinalStateType } from "@ledgerhq/live-dmk-shared";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useFinalErrorViewModel } from "./useFinalErrorViewModel";

jest.mock("../../hooks/useInitializerActions", () => ({
  useInitializerActions: jest.fn(),
}));

const mockedUseInitializerActions = jest.mocked(useInitializerActions);
const openSupport = jest.fn();

describe("useFinalErrorViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseInitializerActions.mockReturnValue({
      openMyLedger: jest.fn(),
      openMyLedgerFirmwareUpdate: jest.fn(),
      openOnboarding: jest.fn(),
      openSupport,
    });
  });

  it("GIVEN a final error state WHEN rendering THEN it exposes the error", () => {
    // GIVEN
    const error = new Error("unexpected");
    const { result } = renderHook(() =>
      useFinalErrorViewModel({
        state: { type: FinalStateType.Error, error },
        onCancel: jest.fn(),
      }),
    );

    // THEN
    expect(result.current.error).toBe(error);
  });

  it("GIVEN a final error state WHEN calling onContactSupport THEN it opens support", () => {
    // GIVEN
    const { result } = renderHook(() =>
      useFinalErrorViewModel({
        state: { type: FinalStateType.Error, error: new Error("unexpected") },
        onCancel: jest.fn(),
      }),
    );

    // WHEN
    result.current.onContactSupport();

    // THEN
    expect(openSupport).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a final error state WHEN calling onCancel THEN it wires cancel", () => {
    // GIVEN
    const onCancel = jest.fn();
    const { result } = renderHook(() =>
      useFinalErrorViewModel({
        state: { type: FinalStateType.Error, error: new Error("unexpected") },
        onCancel,
      }),
    );

    // WHEN
    result.current.onCancel();

    // THEN
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("GIVEN an unknown final error WHEN rendering THEN it exposes a generic error", () => {
    // WHEN
    const { result } = renderHook(() =>
      useFinalErrorViewModel({
        state: {
          type: FinalStateType.Error,
          error: { type: BlockingStateType.UnsupportedFeature },
        },
        onCancel: jest.fn(),
      }),
    );

    // THEN
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe("Unknown error");
  });
});
