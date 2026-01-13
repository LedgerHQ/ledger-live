import React from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import OpenOrInstallTrustChainApp from "../DeviceActions/openOrInstall";

type Props = {
  goNext: (device: Device) => void;
};

export default function DeviceActionStep({ goNext }: Props) {
  return <OpenOrInstallTrustChainApp goNext={goNext} />;
}
