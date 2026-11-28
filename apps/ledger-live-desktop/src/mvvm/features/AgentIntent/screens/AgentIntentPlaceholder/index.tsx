import React from "react";
import { Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAgentIntentEntryPoints } from "@features/flow-agent-intent-entry-points";
import { AgentIntentPlaceholderView } from "./AgentIntentPlaceholderView";

export function AgentIntentPlaceholderScreen() {
  const { t } = useTranslation();
  const { isNavBarEnabled, isProfileEnabled } = useAgentIntentEntryPoints();

  if (!isNavBarEnabled && !isProfileEnabled) {
    return <Navigate to="/" replace />;
  }

  return <AgentIntentPlaceholderView title={t("agentIntent.title")} />;
}
