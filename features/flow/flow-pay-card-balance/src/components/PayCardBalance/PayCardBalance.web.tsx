import React from "react";
import { PayCardBalanceView } from "./PayCardBalanceView.web";
import type { PayCardBalanceProps } from "./types";
import { usePayCardBalanceViewModel } from "./usePayCardBalanceViewModel";

export function PayCardBalance(props: PayCardBalanceProps) {
  return <PayCardBalanceView {...usePayCardBalanceViewModel(props)} />;
}
