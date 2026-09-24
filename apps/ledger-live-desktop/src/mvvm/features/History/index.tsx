import React from "react";
import { HistoryView } from "./HistoryView";
import { useHistoryViewModel } from "./hooks/useHistoryViewModel";
import { useCardHistoryViewModel } from "./components/CardHistory/useCardHistoryViewModel";

const History = () => {
  const viewModel = useHistoryViewModel();
  const cardHistoryViewModel = useCardHistoryViewModel();

  return <HistoryView {...viewModel} cardHistoryViewModel={cardHistoryViewModel} />;
};

export default History;
