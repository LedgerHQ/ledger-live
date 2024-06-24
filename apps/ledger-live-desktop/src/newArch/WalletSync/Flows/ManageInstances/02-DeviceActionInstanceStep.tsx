import React from "react";
import OpenOrInstallTrustChainApp from "../DeviceActions/openOrInstall";

type Props = {
  goNext: (device: Device) => void;
};

export default function DeviceActionInstanceStep({ goNext }: Props) {
  return <OpenOrInstallTrustChainApp goNext={goNext} />;
}
