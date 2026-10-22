import React from "react";
import { AdvancedLogsContentView } from "./AdvancedLogsContentView";
import type { AdvancedLogsContentProps } from "./types";
import { useAdvancedLogsContentViewModel } from "./useAdvancedLogsContentViewModel";

export function AdvancedLogsContent(props: AdvancedLogsContentProps) {
  return <AdvancedLogsContentView {...useAdvancedLogsContentViewModel(props)} />;
}
