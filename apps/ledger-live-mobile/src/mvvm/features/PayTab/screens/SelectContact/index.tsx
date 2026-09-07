import React from "react";
import { PayTabSelectContactView } from "./PayTabSelectContactView";
import { usePayTabSelectContactViewModel } from "./usePayTabSelectContactViewModel";

export function PayTabSelectContactScreen() {
  return <PayTabSelectContactView {...usePayTabSelectContactViewModel()} />;
}
