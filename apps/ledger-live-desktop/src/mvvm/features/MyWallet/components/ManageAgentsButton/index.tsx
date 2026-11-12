import React from "react";
import { ManageAgentsCard } from "@features/platform-agent-intent-entry-points";
import { useManageAgentsButtonViewModel } from "./hooks/useManageAgentsButtonViewModel";

export function ManageAgentsButton() {
  const { isEnabled, title, description, newBadgeLabel, openAgentIntent } =
    useManageAgentsButtonViewModel();

  if (!isEnabled) {
    return null;
  }

  return (
    <ManageAgentsCard
      title={title}
      description={description}
      newBadgeLabel={newBadgeLabel}
      onOpen={openAgentIntent}
    />
  );
}
