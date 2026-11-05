import { useState } from "react";
import type { AcknowledgementProps, AcknowledgementViewProps } from "./Acknowledgement.types";

export function useAcknowledgementViewModel(props: AcknowledgementProps): AcknowledgementViewProps {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  return { ...props, hasAcknowledged, onAcknowledgedChange: setHasAcknowledged };
}
