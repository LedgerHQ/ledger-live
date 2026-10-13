import React from "react";
import type { ShowExchangeErrorIntentJobState } from "@ledgerhq/live-common/exchange/intents/index";
import { ExchangeErrorState } from "./ExchangeErrorState";
import { IncompatibleDeviceState } from "./IncompatibleDeviceState";

type ShowExchangeErrorIntentComponentProps = Readonly<{
  jobState: ShowExchangeErrorIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function ShowExchangeErrorIntentComponent({
  jobState,
  onClose,
}: ShowExchangeErrorIntentComponentProps) {
  if (!jobState) {
    return null;
  }

  switch (jobState.type) {
    case "error":
      return <ExchangeErrorState error={jobState.error} onClose={onClose} />;
    case "incompatible-device":
      return <IncompatibleDeviceState state={jobState} onClose={onClose} />;
    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled show exchange error intent state: ${JSON.stringify(value)}`);
}
