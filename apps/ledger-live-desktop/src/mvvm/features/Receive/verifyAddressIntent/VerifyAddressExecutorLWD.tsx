import React from "react";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import { useVerifyAddressExecutorViewModel } from "./useVerifyAddressExecutorViewModel";

type Props = Parameters<typeof useVerifyAddressExecutorViewModel>[0];

export function VerifyAddressExecutorLWD(props: Props): React.ReactElement | null {
  const executor = useVerifyAddressExecutorViewModel(props);

  if (!executor) return null;

  return <DeviceIntentExecutor enabled sourceFlow="receive" {...executor} />;
}
