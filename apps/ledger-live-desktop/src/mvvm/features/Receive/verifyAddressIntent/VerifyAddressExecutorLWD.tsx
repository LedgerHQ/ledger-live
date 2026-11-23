import React from "react";
import { DeviceIntentExecutor } from "LLD/components/DeviceIntentExecutor";
import { useVerifyAddressExecutorViewModel } from "./useVerifyAddressExecutorViewModel";

type Props = Parameters<typeof useVerifyAddressExecutorViewModel>[0];

/**
 * Kept for the receive flow, which imports it by deep path once its verify-address step lands.
 * @public
 */
export function VerifyAddressExecutorLWD(props: Props): React.ReactElement | null {
  const executor = useVerifyAddressExecutorViewModel(props);

  if (!executor) return null;

  return <DeviceIntentExecutor enabled sourceFlow="receive" {...executor} />;
}
