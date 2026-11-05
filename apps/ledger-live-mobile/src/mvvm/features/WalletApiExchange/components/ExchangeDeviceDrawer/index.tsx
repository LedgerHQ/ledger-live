import React, { memo } from "react";
import { ExchangeDeviceExecutor } from "../ExchangeDeviceExecutor";
import { useExchangeDeviceDrawerViewModel } from "./useExchangeDeviceDrawerViewModel";

type Props = Readonly<{
  /** Only the live app that owns the open session shows its drawer. */
  manifestId: string;
}>;

/**
 * Hosts the `custom.exchange.*` device steps (nonce, confirmation on the Exchange app, signature)
 * inside the webview subtree, so the drawer floats over the live app.
 */
function ExchangeDeviceDrawer({ manifestId }: Props) {
  const { session } = useExchangeDeviceDrawerViewModel({ manifestId });

  if (!session) {
    return null;
  }

  // A new session id means a new executor, even if the old one would otherwise be reused.
  return <ExchangeDeviceExecutor key={session.id} session={session} />;
}

export default memo(ExchangeDeviceDrawer);
