import React from "react";
import { TrackScreen } from "@shared/analytics-react";
import type { AleoAddAccountPageName, AleoAddAccountEventsParams } from "./addAccount.types";

type AleoTrackAddAccountScreenProps<T extends AleoAddAccountPageName> = {
  page: T;
} & AleoAddAccountEventsParams[T];

export const AleoTrackAddAccountScreen = <T extends AleoAddAccountPageName>({
  page,
  ...props
}: AleoTrackAddAccountScreenProps<T>) => {
  return <TrackScreen category={page} {...props} />;
};
