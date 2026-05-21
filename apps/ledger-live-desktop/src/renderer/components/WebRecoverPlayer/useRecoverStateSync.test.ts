import { act, renderHook } from "tests/testSetup";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { setRecoverState } from "~/renderer/reducers/recoverState";
import { getStoreValue } from "~/renderer/store";
import useRecoverStateSync from "./useRecoverStateSync";

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
}));

const dispatchSpy = jest.fn();

jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => dispatchSpy,
}));

const PROTECT_ID = "protect-test";
const mockedGetStoreValue = jest.mocked(getStoreValue);

const stateWith = (subscriptionState: LedgerRecoverSubscriptionStateEnum) => ({
  recoverState: {
    protectIdState: {
      [PROTECT_ID]: {
        subscriptionState,
        displayBanner: true,
      },
    },
  },
});

describe("useRecoverStateSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("dispatches setRecoverState on unmount when persisted differs from current Redux entry", () => {
    mockedGetStoreValue.mockReturnValue(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE);

    const { unmount } = renderHook(() => useRecoverStateSync(PROTECT_ID), {
      initialState: stateWith(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION),
    });

    dispatchSpy.mockClear();
    unmount();

    expect(mockedGetStoreValue).toHaveBeenCalledWith("SUBSCRIPTION_STATE", PROTECT_ID);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(
      setRecoverState({
        protectId: PROTECT_ID,
        subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
      }),
    );
  });

  it("does not dispatch on unmount when persisted equals current Redux entry", () => {
    mockedGetStoreValue.mockReturnValue(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE);

    const { unmount } = renderHook(() => useRecoverStateSync(PROTECT_ID), {
      initialState: stateWith(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE),
    });

    dispatchSpy.mockClear();
    unmount();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("does not dispatch on unmount when persisted value is undefined", () => {
    mockedGetStoreValue.mockReturnValue(undefined);

    const { unmount } = renderHook(() => useRecoverStateSync(PROTECT_ID), {
      initialState: stateWith(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION),
    });

    dispatchSpy.mockClear();
    unmount();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("compares against the latest Redux entry, not the one at mount time", () => {
    mockedGetStoreValue.mockReturnValue(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE);

    const { unmount, store } = renderHook(() => useRecoverStateSync(PROTECT_ID), {
      initialState: stateWith(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION),
    });

    act(() => {
      store.dispatch(
        setRecoverState({
          protectId: PROTECT_ID,
          subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
        }),
      );
    });

    dispatchSpy.mockClear();
    unmount();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});
