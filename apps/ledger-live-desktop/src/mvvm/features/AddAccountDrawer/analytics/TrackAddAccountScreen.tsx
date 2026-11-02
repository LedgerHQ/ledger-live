import React from "react";
import { TrackScreen } from "@shared/analytics-react";
import { AddAccountPageName, AddAccountEventParams } from "./addAccount.types";

type TrackAddAccountScreenProps<T extends AddAccountPageName> = {
  page: T;
} & AddAccountEventParams[T];

export const TrackAddAccountScreen = <T extends AddAccountPageName>({
  page,
  ...props
}: TrackAddAccountScreenProps<T>) => {
  return <TrackScreen category={page} {...props} />;
};
