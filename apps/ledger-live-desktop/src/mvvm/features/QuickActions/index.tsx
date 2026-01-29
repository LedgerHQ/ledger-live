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

const QuickActions = () => {
  const { actionsList } = useQuickActions();
  return <QuickActionsView actionsList={actionsList} />;
};

export { QuickActionsView };
export default QuickActions;
