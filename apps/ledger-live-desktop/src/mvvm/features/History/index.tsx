import React from "react";
import { HistoryView } from "./HistoryView";
import { useHistoryViewModel } from "./useHistoryViewModel";

const History = () => <HistoryView {...useHistoryViewModel()} />;

export default History;
