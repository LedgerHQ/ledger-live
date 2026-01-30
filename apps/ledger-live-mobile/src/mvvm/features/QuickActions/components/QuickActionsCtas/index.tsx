import React from "react";
import QuickActionsCtasView from "./QuickActionsCtasView";
import { useQuickActionsCtasViewModel } from "./useQuickActionsCtasViewModel";
import { QuickActionsCtasProps } from "../../types";

export const QuickActionsCtas = ({ sourceScreenName }: QuickActionsCtasProps) => {
  const { quickActions } = useQuickActionsCtasViewModel({
    sourceScreenName,
  });

  return <QuickActionsCtasView quickActions={quickActions} />;
};
