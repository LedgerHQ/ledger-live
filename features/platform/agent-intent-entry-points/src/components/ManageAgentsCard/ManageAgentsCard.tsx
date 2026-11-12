import React from "react";
import type { ManageAgentsCardProps } from "./ManageAgentsCard.types";
import { ManageAgentsCardView } from "./ManageAgentsCardView";
import { useManageAgentsCardViewModel } from "./useManageAgentsCardViewModel";

export function ManageAgentsCard(props: ManageAgentsCardProps) {
  return <ManageAgentsCardView {...useManageAgentsCardViewModel(props)} />;
}
