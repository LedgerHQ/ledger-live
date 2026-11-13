import React from "react";
import { useTranslation } from "~/context/Locale";
import { AgentIntentPlaceholderView } from "./AgentIntentPlaceholderView";

export function AgentIntentPlaceholderScreen() {
  const { t } = useTranslation();
  return <AgentIntentPlaceholderView title={t("agentIntent.title")} />;
}
