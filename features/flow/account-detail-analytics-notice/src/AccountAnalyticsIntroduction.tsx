import React from "react";
import { AccountAnalyticsIntroductionView } from "./AccountAnalyticsIntroductionView";
import { useAccountAnalyticsIntroductionViewModel } from "./useAccountAnalyticsIntroductionViewModel";
import type { AccountAnalyticsIntroductionProps } from "./AccountAnalyticsIntroduction.types";

export function AccountAnalyticsIntroduction(props: AccountAnalyticsIntroductionProps) {
  return <AccountAnalyticsIntroductionView {...useAccountAnalyticsIntroductionViewModel(props)} />;
}
