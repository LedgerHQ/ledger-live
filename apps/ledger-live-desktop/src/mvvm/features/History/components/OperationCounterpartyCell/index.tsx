import React from "react";
import type { OperationTableItem } from "../../types";
import { OperationCounterpartyCellView } from "./OperationCounterpartyCellView";
import { useOperationCounterpartyCellViewModel } from "./useOperationCounterpartyCellViewModel";

type OperationCounterpartyCellProps = {
  readonly item: OperationTableItem;
  readonly prefix?: string;
  readonly children?: React.ReactNode;
};

export const OperationCounterpartyCell = ({
  item,
  prefix,
  children,
}: OperationCounterpartyCellProps) => {
  const viewModel = useOperationCounterpartyCellViewModel(item);

  return (
    <OperationCounterpartyCellView {...viewModel} prefix={prefix}>
      {children}
    </OperationCounterpartyCellView>
  );
};
