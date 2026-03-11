import React from "react";
import { AllocationSubheader } from "../AllocationSubHeader";
import { AllocationTable } from "./AllocationTable";
import type { AllocationViewProps } from "../../types";

export const AllocationView = ({ items }: AllocationViewProps) => {
  return (
    <div className="flex flex-col gap-12">
      <AllocationSubheader />
      <AllocationTable items={items} />
    </div>
  );
};
