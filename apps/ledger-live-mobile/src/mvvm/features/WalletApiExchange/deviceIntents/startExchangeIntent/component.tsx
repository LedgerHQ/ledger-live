import React from "react";
import type { StartExchangeIntentJobState } from "@ledgerhq/live-common/exchange/intents/index";
import { ExchangeSpinner } from "../ExchangeSpinner";

type StartExchangeIntentComponentProps = Readonly<{
  jobState: StartExchangeIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/**
 * The user has nothing to do while the Exchange app gives out a nonce, and the drawer then waits
 * on the same spinner while the provider payload is fetched.
 */
export function StartExchangeIntentComponent({ jobState }: StartExchangeIntentComponentProps) {
  if (!jobState) {
    return <ExchangeSpinner testID="wallet-api-exchange-loading" />;
  }

  switch (jobState.type) {
    case "starting":
    case "nonce-ready":
    case "error":
      return <ExchangeSpinner testID="wallet-api-exchange-loading" />;
    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled start exchange intent state: ${JSON.stringify(value)}`);
}
