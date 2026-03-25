import React from "react";
import { HistoryActionsBarView } from "./HistoryActionsBarView";
import { useHistoryActionsBarViewModel } from "./useHistoryActionsBarViewModel";

export const HistoryActionsBar = () => (
  <HistoryActionsBarView {...useHistoryActionsBarViewModel()} />
);
