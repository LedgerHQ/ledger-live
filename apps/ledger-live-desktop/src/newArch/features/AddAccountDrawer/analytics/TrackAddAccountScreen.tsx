import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { AddAccountPageName, AddAccountEventParams } from "./addAccount.types";

type TrackAddAccountScreenProps<T extends AddAccountPageName> = {
  page: T;
} & AddAccountEventParams[T];

export const TrackAddAccountScreen = <T extends AddAccountPageName>({
  page,
  ...props
}: TrackAddAccountScreenProps<T>) => {
  return <TrackPage category={page} {...props} />;
};
