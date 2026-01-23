import React, { memo } from "react";
import { ActionsList } from "./components/ActionsList";
import { useQuickActions } from "./hooks/useQuickActions";
import { QuickAction } from "./types";

interface QuickActionsProps {
  hasAccount: boolean;
  actionsList: QuickAction[];
}

const QuickActionsView = memo(function QuickActionsView({
  hasAccount,
  actionsList,
}: QuickActionsProps) {
  if (!hasAccount) {
    // onboarding scenario
    return null;
  }

  return <ActionsList actionsList={actionsList} />;
});

const QuickActions = () => {
  const { hasAccount, actionsList } = useQuickActions();
  return <QuickActionsView hasAccount={hasAccount} actionsList={actionsList} />;
};

export { QuickActionsView };
export default QuickActions;
