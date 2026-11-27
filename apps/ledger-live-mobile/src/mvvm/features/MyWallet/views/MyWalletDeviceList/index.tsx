import React from "react";
import { MyWalletDeviceListView } from "./MyWalletDeviceListView";
import type { MyWalletDeviceListProps } from "./types";
import { useMyWalletDeviceListViewModel } from "./useMyWalletDeviceListViewModel";

/**
 * The device section of My Wallet behind `lwmMyWalletDeviceList`: the device list, then the lock
 * check and the My Ledger device action of the connected device.
 */
export function MyWalletDeviceList(props: Readonly<MyWalletDeviceListProps>) {
  const viewModel = useMyWalletDeviceListViewModel(props);

  return <MyWalletDeviceListView {...viewModel} />;
}
