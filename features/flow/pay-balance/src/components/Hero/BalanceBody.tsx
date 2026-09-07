import React from "react";
import type { BalanceViewProps } from "../../types";
import { BalanceEmptyState } from "./BalanceEmptyState";
import { BalanceFundedState } from "./BalanceFundedState";
import { BalanceFilterPicker } from "../Filter/BalanceFilterPicker";

export function BalanceBody(props: BalanceViewProps) {
  if (props.displayMode === "empty") {
    return <BalanceEmptyState labels={props.labels} />;
  }

  return (
    <>
      <BalanceFundedState
        balance={props.balance}
        formatCountervalue={props.formatCountervalue}
        isLoading={props.isLoading}
        allStablecoinsLabel={props.labels.allStablecoins}
        selectedOption={props.selectedOption}
        onOpenFilter={props.onOpenFilter}
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
