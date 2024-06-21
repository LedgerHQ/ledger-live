import React from "react";
import OpenOrInstallTrustChainApp from "../DeviceActions/openOrInstall";

type Props = {
  goNext: () => void;
};

export default function DeviceActionInstanceStep({ goNext }: Props) {
  return <OpenOrInstallTrustChainApp goNext={goNext} />;
}
