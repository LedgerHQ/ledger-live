import { useCallback, useState } from "react";

/** What opens over the address: a panel in the desktop dialog, a bottom sheet on mobile. */
export type ReceiveAddressPanel = "serviceStatus" | "memo" | "help";

export function useReceiveAddressPanel() {
  const [panel, setPanel] = useState<ReceiveAddressPanel>();
  const closePanel = useCallback(() => setPanel(undefined), []);
  return { panel, openPanel: setPanel, closePanel };
}
