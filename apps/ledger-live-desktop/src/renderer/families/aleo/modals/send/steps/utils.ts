import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { AccountLike } from "@ledgerhq/types-live";
import type { TFunction } from "i18next";

export const isAleoAccount = (acc: AccountLike): acc is AleoAccount => "aleoResources" in acc;

export const SIGNING_RECORDS_TIME = 12500;

// Helper function to get estimated signing time based on the number of records being signed.
export const getEstimatedSigningTime = (recordCount: number, t: TFunction): string => {
  const totalSeconds = (recordCount * SIGNING_RECORDS_TIME) / 1000;

  if (totalSeconds < 60) {
    return `~${Math.round(totalSeconds)} ${t("time.second_short")}`;
  }

  const flooredSeconds = Math.floor(totalSeconds / 30) * 30;
  const minutes = flooredSeconds / 60;
  return `~${minutes} ${t("time.minute_short")}`;
};
