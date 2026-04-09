import React from "react";
import { HistoryView } from "./HistoryView";
import { useHistoryViewModel } from "./hooks/useHistoryViewModel";

const History = () => {
  const viewModel = useHistoryViewModel();

  return <HistoryView {...viewModel} />;
};

export default History;
