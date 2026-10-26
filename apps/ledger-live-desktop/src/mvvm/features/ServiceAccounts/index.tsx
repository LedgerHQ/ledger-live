import React from "react";
import { useServiceAccountsViewModel } from "./hooks/useServiceAccountsViewModel";
import { ServiceAccountsView } from "./ServiceAccountsView";
import type { ServiceAccountsProps } from "./types";

export default function ServiceAccounts(props: ServiceAccountsProps) {
  return <ServiceAccountsView {...useServiceAccountsViewModel(props)} />;
}
