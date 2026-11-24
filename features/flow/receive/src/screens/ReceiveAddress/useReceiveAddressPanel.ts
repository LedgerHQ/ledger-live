import { useCallback, useState } from "react";

export type ReceiveAddressPanel = "serviceStatus";

export function useReceiveAddressPanel() {
  const [panel, setPanel] = useState<ReceiveAddressPanel>();
  const closePanel = useCallback(() => setPanel(undefined), []);
  return { panel, openPanel: setPanel, closePanel };
}
