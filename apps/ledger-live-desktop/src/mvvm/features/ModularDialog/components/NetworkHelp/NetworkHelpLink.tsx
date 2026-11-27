import React, { useEffect, useRef } from "react";
import { NetworkHelpDescription } from "@features/flow-receive";
import type { NetworkHelp } from "../../hooks/useNetworkHelp";

type NetworkHelpLinkProps = Readonly<{
  assetTicker: string;
  networkHelp: NetworkHelp;
}>;

/** The network step's description, which takes the focus back once the help it opened closes. */
export function NetworkHelpLink({ assetTicker, networkHelp }: NetworkHelpLinkProps) {
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (wasOpen.current && !networkHelp.isOpen) {
      ref.current?.querySelector<HTMLElement>("a, button")?.focus();
    }
    wasOpen.current = networkHelp.isOpen;
  }, [networkHelp.isOpen]);

  return (
    <div ref={ref} className="mb-16 px-8">
      <NetworkHelpDescription assetTicker={assetTicker} onLearnMore={networkHelp.open} />
    </div>
  );
}
