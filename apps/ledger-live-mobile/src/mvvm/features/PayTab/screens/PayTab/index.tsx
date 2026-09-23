import React from "react";
import { PayTabView } from "./PayTabView";
import { usePayTabViewModel } from "./usePayTabViewModel";

export function PayTabScreen() {
  return <PayTabView {...usePayTabViewModel()} />;
}
