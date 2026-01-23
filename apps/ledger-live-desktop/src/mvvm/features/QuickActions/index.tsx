import React from "react";
import { ActionsList } from "./components/ActionsList";

interface QuickActionsProps {
  hasAccount: boolean;
  hasFunds?: boolean;
}

const QuickActions = ({ hasAccount, hasFunds }: QuickActionsProps) => {
  if (!hasAccount) {
    // onboarding scenaio
    return null;
  }

  return <ActionsList hasFunds={hasFunds} />;
};

export default QuickActions;
