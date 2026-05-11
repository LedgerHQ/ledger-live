import { setDisplayBanner, setRecoverState } from "~/renderer/reducers/recoverState";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";

const SUBSCRIPTION_STATE_STORAGE_KEY = "SUBSCRIPTION_STATE";
const DISPLAY_BANNER_STORAGE_KEY = "DISPLAY_BANNER";

type SyncRecoverStateFromStorageSetParams = {
  key: string;
  value: unknown;
  storeId: string;
  dispatch: (
    action: ReturnType<typeof setRecoverState> | ReturnType<typeof setDisplayBanner>,
  ) => void;
};

function isRecoverSubscriptionState(value: unknown): value is LedgerRecoverSubscriptionStateEnum {
  return (
    typeof value === "string" &&
    Object.values(LedgerRecoverSubscriptionStateEnum).includes(
      value as LedgerRecoverSubscriptionStateEnum,
    )
  );
}

function isDisplayBannerValue(value: unknown): value is "true" | "false" {
  return value === "true" || value === "false";
}

export function syncRecoverStateFromStorageSet({
  key,
  value,
  storeId,
  dispatch,
}: SyncRecoverStateFromStorageSetParams): void {
  if (key === SUBSCRIPTION_STATE_STORAGE_KEY && isRecoverSubscriptionState(value)) {
    dispatch(setRecoverState({ protectId: storeId, subscriptionState: value }));
    return;
  }

  if (key === DISPLAY_BANNER_STORAGE_KEY && isDisplayBannerValue(value)) {
    dispatch(setDisplayBanner({ protectId: storeId, displayBanner: value === "true" }));
  }
}
