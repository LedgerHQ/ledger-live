import React, { memo } from "react";
import { ActionsList } from "./components/ActionsList";
import { useQuickActions } from "./hooks/useQuickActions";
import { QuickAction } from "./types";

interface QuickActionsProps {
  actionsList: QuickAction[];
}

const QuickActionsView = memo(function QuickActionsView({ actionsList }: QuickActionsProps) {
  return <ActionsList actionsList={actionsList} />;
});

const QuickActions = ({ trackingPageName }: { trackingPageName: string }) => {
  const { actionsList } = useQuickActions(trackingPageName);
  return <QuickActionsView actionsList={actionsList} />;
};

export { QuickActionsView };
export default QuickActions;
