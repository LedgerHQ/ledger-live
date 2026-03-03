import { act, renderHook } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import useEditTransactionSummaryActions from "../useEditTransactionSummaryActions";

describe("useEditTransactionSummaryActions", () => {
  const transaction = { amount: "1" };
  const status = { errors: {} };
  const routeParams = { accountId: "acc-1" };

  it("navigates to default screen when nextNavigation is not provided", () => {
    const navigate = jest.fn();
    const { result } = renderHook(() =>
      useEditTransactionSummaryActions({
        navigation: { navigate },
        routeParams,
        transaction,
        status,
      }),
    );

    act(() => {
      result.current.onContinue();
    });

    expect(navigate).toHaveBeenCalledWith(ScreenName.SendSelectDevice, {
      ...routeParams,
      transaction,
      status,
      selectDeviceLink: true,
    });
  });

  it("navigates to provided nextNavigation screen", () => {
    const navigate = jest.fn();
    const { result } = renderHook(() =>
      useEditTransactionSummaryActions({
        navigation: { navigate },
        nextNavigation: "CustomNextScreen",
        routeParams,
        transaction,
        status,
      }),
    );

    act(() => {
      result.current.onContinue();
    });

    expect(navigate).toHaveBeenCalledWith("CustomNextScreen", {
      ...routeParams,
      transaction,
      status,
      selectDeviceLink: true,
    });
  });

  it("opens confirmation modal when fee is too high and continues after accept", () => {
    const navigate = jest.fn();
    const { result } = renderHook(() =>
      useEditTransactionSummaryActions({
        navigation: { navigate },
        nextNavigation: "CustomNextScreen",
        routeParams,
        transaction,
        status,
        feeTooHigh: new Error("fee too high"),
      }),
    );

    act(() => {
      result.current.onContinue();
    });

    expect(result.current.highFeesOpen).toBe(true);
    expect(navigate).not.toHaveBeenCalled();

    act(() => {
      result.current.onAcceptFees();
    });

    expect(result.current.highFeesOpen).toBe(false);
    expect(navigate).toHaveBeenCalledWith("CustomNextScreen", {
      ...routeParams,
      transaction,
      status,
      selectDeviceLink: true,
    });
  });

  it("closes confirmation modal on reject", () => {
    const { result } = renderHook(() =>
      useEditTransactionSummaryActions({
        navigation: { navigate: jest.fn() },
        routeParams,
        transaction,
        status,
        feeTooHigh: new Error("fee too high"),
      }),
    );

    act(() => {
      result.current.onContinue();
    });
    expect(result.current.highFeesOpen).toBe(true);

    act(() => {
      result.current.onRejectFees();
    });
    expect(result.current.highFeesOpen).toBe(false);
  });
});
