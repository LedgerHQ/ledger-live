import React, { useEffect, useRef } from "react";
import { NetworkHelpPanel } from "@features/flow-receive";

/** The help over the network step, focused on open: the "Learn more" link it covers had the focus. */
export function NetworkHelpOverlay() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div ref={ref} tabIndex={-1} className="absolute inset-0 overflow-y-auto outline-none">
      <NetworkHelpPanel />
    </div>
  );
}
