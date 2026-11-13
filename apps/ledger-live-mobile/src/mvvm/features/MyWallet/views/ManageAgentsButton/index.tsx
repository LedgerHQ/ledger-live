import React from "react";
import { ManageAgentsCard } from "@features/flow-agent-intent-entry-points";
import { useManageAgentsButtonViewModel } from "./useManageAgentsButtonViewModel";

export function ManageAgentsButton() {
  const { isEnabled, openAgentIntent } = useManageAgentsButtonViewModel();

  if (!isEnabled) {
    return null;
  }

  return <ManageAgentsCard onOpen={openAgentIntent} />;
}
