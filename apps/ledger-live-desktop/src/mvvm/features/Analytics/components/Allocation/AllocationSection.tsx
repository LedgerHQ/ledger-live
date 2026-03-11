import React from "react";
import { useAllocationData } from "../../hooks/useAllocationData";
import { AllocationView } from "./AllocationView";

export const AllocationSection = () => {
  const allocation = useAllocationData();
  return <AllocationView {...allocation} />;
};
