import React from "react";
import type { PayCardBalanceViewProps } from "../../types";
import { PayCardBalanceEmptyState } from "./PayCardBalanceEmptyState";
import { PayCardBalanceFundedState } from "./PayCardBalanceFundedState";
import { BalanceFilterPicker } from "../Filter/BalanceFilterPicker";

export function PayCardBalanceBody(props: PayCardBalanceViewProps) {
  if (props.displayMode !== "funded") {
    return <PayCardBalanceEmptyState labels={props.labels} />;
  }

  return (
    <>
      <PayCardBalanceFundedState
        balance={props.balance}
        formatCountervalue={props.formatCountervalue}
        isLoading={props.isLoading}
        allStablecoinsLabel={props.labels.allStablecoins}
        selectedOption={props.selectedOption}
        onOpenFilter={props.onOpenFilter}
        actionTiles={props.actionTiles}
      />
      <BalanceFilterPicker
        isOpen={props.isFilterOpen}
        filter={props.filter}
        options={props.options}
        labels={props.labels}
        onClose={props.onCloseFilter}
        onConfirmFilter={props.onConfirmFilter}
        onTrackEvent={props.onTrackEvent}
      />
    </>
  );
}
