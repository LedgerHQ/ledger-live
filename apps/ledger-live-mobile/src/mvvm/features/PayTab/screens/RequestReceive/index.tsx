import React from "react";
import { PayTabRequestReceiveView } from "./PayTabRequestReceiveView";
import { usePayTabRequestReceiveViewModel } from "./usePayTabRequestReceiveViewModel";

export const PayTabRequestReceiveScreen = () => {
  return <PayTabRequestReceiveView {...usePayTabRequestReceiveViewModel()} />;
};
