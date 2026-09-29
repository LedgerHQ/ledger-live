import React from "react";
import { PayTabView } from "./PayTabView";
import { usePayTabViewModel } from "./usePayTabViewModel";

export default function PayTab() {
  return <PayTabView {...usePayTabViewModel()} />;
}
