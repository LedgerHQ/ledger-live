import React from "react";
import { MyWalletScreenView } from "./MyWalletScreenView";
import { useMyWalletScreenViewModel } from "./useMyWalletScreenViewModel";

export function MyWalletScreen() {
  return <MyWalletScreenView {...useMyWalletScreenViewModel()} />;
}
