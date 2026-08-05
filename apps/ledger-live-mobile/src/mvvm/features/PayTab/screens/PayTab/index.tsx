import React from "react";
import { PayTabView } from "./PayTabView";
import { usePayTabViewModel } from "./usePayTabViewModel";

export const PayTabScreen = () => {
  return <PayTabView {...usePayTabViewModel()} />;
};
