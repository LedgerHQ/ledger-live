import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { AleoAddAccountPageName, AleoAddAccountEventsParams } from "./addAccount.types";

type AleoTrackAddAccountScreenProps<T extends AleoAddAccountPageName> = {
  page: T;
} & AleoAddAccountEventsParams[T];

export const AleoTrackAddAccountScreen = <T extends AleoAddAccountPageName>({
  page,
  ...props
}: AleoTrackAddAccountScreenProps<T>) => {
  return <TrackPage category={page} {...props} />;
};
