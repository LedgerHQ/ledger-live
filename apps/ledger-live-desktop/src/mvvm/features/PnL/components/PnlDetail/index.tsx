import React from "react";
import type { PnlDetailItem } from "./usePnlDetailViewModel";
import { usePnlDetailViewModel } from "./usePnlDetailViewModel";
import { PnlDetailView } from "./PnlDetailView";

type PnlDetailProps = {
  title: string;
  description: string;
  items: PnlDetailItem[];
};

export const PnlDetail = ({ title, description, items }: PnlDetailProps) => {
  const viewModel = usePnlDetailViewModel({ title, description, items });
  return <PnlDetailView {...viewModel} />;
};
