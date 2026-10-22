import React from "react";
import { AdvancedLogsView } from "./AdvancedLogsView";
import { useAdvancedLogsViewModel } from "./useAdvancedLogsViewModel";

export default function AdvancedLogs() {
  const { input, locale, derivationTag } = useAdvancedLogsViewModel();

  if (!input) return null;

  return <AdvancedLogsView input={input} locale={locale} derivationTag={derivationTag} />;
}
