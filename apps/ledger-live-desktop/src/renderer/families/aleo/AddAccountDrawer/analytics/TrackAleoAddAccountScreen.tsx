import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { AleoAddAccountPageName, AleoAddAccountEventsParams } from "./addAccount.types";

type TrackAleoAddAccountScreenProps<T extends AleoAddAccountPageName> = {
  page: T;
} & AleoAddAccountEventsParams[T];

export const TrackAleoAddAccountScreen = <T extends AleoAddAccountPageName>({
  page,
  ...props
}: TrackAleoAddAccountScreenProps<T>) => {
  return <TrackPage category={page} {...props} />;
};
