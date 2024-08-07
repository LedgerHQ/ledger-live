import React from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import OpenOrInstallTrustChainApp from "../DeviceActions/openOrInstall";
import { useInitMemberCredentials } from "../../hooks/useInitMemberCredentials";

type Props = {
  goNext: (device: Device) => void;
};

export default function DeviceActionStep({ goNext }: Props) {
  useInitMemberCredentials();

  return <OpenOrInstallTrustChainApp goNext={goNext} />;
}
