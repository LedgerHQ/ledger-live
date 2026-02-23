import React from "react";

import { TrackScreen } from "~/analytics";

import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import BuyDeviceView from "../components/BuyDeviceView";
import useRebornBuyDeviceViewModel from "./useRebornBuyDeviceViewModel";

type ViewProps = Readonly<{
  isOpen: boolean;
  handleClose: () => void;
}>;

function View({ isOpen, handleClose }: ViewProps) {
  return (
    <QueuedDrawerGorhom isRequestingToBeOpened={isOpen} snapPoints={["98%"]} onClose={handleClose}>
      <TrackScreen category="RebornDrawer" name="Upsell Flex" type="drawer" />
      <BuyDeviceView />
    </QueuedDrawerGorhom>
  );
}

const RebornBuyDeviceDrawer = () => <View {...useRebornBuyDeviceViewModel()} />;

export default RebornBuyDeviceDrawer;
