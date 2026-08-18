import { useMemo, useState } from "react";
import type { Envelope, MessageMap } from "@devtools/transport";

const COLLAPSED_LIMIT = 50;
const EXPANDED_LIMIT = 500;

export function useHistoryLine<M extends MessageMap>(envelope: Envelope<M>, localOrigin: string) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSent = envelope.origin === localOrigin;

  const collapsed = `#${envelope.seq} ${String(envelope.kind)} ${envelope.id} ${JSON.stringify(envelope.payload)}`;
  const collapsedText =
    collapsed.length > COLLAPSED_LIMIT ? collapsed.slice(0, COLLAPSED_LIMIT) + "…" : collapsed;

  const expandedText = useMemo(() => {
    const payloadJson = JSON.stringify(envelope.payload, null, 2);
    const payload =
      payloadJson !== undefined && payloadJson.length > EXPANDED_LIMIT
        ? "Output too big to display"
        : envelope.payload;
    return JSON.stringify({ ...envelope, payload }, null, 2);
  }, [envelope]);

  return { isExpanded, setIsExpanded, isSent, collapsedText, expandedText };
}
