import { setDisplayBanner, setRecoverState } from "~/renderer/reducers/recoverState";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { syncRecoverStateFromStorageSet } from "../syncRecoverStateFromStorageSet";

const PROTECT_ID = "protect-test";

describe("syncRecoverStateFromStorageSet", () => {
  it("should dispatch Recover subscription state for valid SUBSCRIPTION_STATE values", () => {
    const dispatch = jest.fn();

    syncRecoverStateFromStorageSet({
      key: "SUBSCRIPTION_STATE",
      value: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
      storeId: PROTECT_ID,
      dispatch,
    });

    expect(dispatch).toHaveBeenCalledWith(
      setRecoverState({
        protectId: PROTECT_ID,
        subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
      }),
    );
  });

  it("should no-op for invalid subscription values", () => {
    const dispatch = jest.fn();

    syncRecoverStateFromStorageSet({
      key: "SUBSCRIPTION_STATE",
      value: "unexpected-state",
      storeId: PROTECT_ID,
      dispatch,
    });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should no-op for unrelated storage keys", () => {
    const dispatch = jest.fn();

    syncRecoverStateFromStorageSet({
      key: "OTHER_KEY",
      value: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
      storeId: PROTECT_ID,
      dispatch,
    });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should dispatch display banner state for DISPLAY_BANNER values", () => {
    const dispatch = jest.fn();

    syncRecoverStateFromStorageSet({
      key: "DISPLAY_BANNER",
      value: "false",
      storeId: PROTECT_ID,
      dispatch,
    });

    expect(dispatch).toHaveBeenCalledWith(
      setDisplayBanner({ protectId: PROTECT_ID, displayBanner: false }),
    );
  });

  it("should no-op for invalid display banner values", () => {
    const dispatch = jest.fn();

    syncRecoverStateFromStorageSet({
      key: "DISPLAY_BANNER",
      value: "invalid",
      storeId: PROTECT_ID,
      dispatch,
    });

    expect(dispatch).not.toHaveBeenCalled();
  });
});
