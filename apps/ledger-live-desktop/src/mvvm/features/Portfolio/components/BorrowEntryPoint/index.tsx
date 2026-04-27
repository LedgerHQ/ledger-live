import React from "react";
import { useBorrowEntryPointViewModel } from "../../hooks/useBorrowEntryPointViewModel";
import { BorrowEntryPointView } from "./BorrowEntryPointView";

export const BorrowEntryPoint = () => {
  const { handleClick } = useBorrowEntryPointViewModel();

  return <BorrowEntryPointView onClick={handleClick} />;
};
