import type { Envelope, MessageMap } from "@devtools/transport";
import { ArrowUp, ArrowDown } from "@ledgerhq/lumen-ui-react/symbols";
import { useMemo, useState } from "react";

const COLLAPSED_LIMIT = 50;
const EXPANDED_LIMIT = 500;

interface HistoryLineProps<M extends MessageMap> {
  readonly envelope: Envelope<M>;
  readonly localOrigin: string;
}

export function HistoryLine<M extends MessageMap>({ envelope, localOrigin }: HistoryLineProps<M>) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isSent = envelope.origin === localOrigin;
  const Arrow = isSent ? ArrowUp : ArrowDown;

  const collapsed = `#${envelope.seq} ${String(envelope.kind)} ${envelope.id} ${JSON.stringify(envelope.payload)}`;
  const collapsedText =
    collapsed.length > COLLAPSED_LIMIT ? collapsed.slice(0, COLLAPSED_LIMIT) + "…" : collapsed;

  const expandedText = useMemo(() => {
    const payloadJson = JSON.stringify(envelope.payload, null, 2);
    const payload =
      payloadJson.length > EXPANDED_LIMIT ? "Output too big to display" : envelope.payload;
    return JSON.stringify({ ...envelope, payload }, null, 2);
  }, [envelope]);

  return (
    <button
      type="button"
      className="flex items-start gap-8 w-full text-left hover:bg-muted-hover rounded-sm p-4 transition-colors duration-150"
      onClick={() => setIsExpanded(prev => !prev)}
    >
      <Arrow size={12} className={`shrink-0 mt-2 ${isSent ? "text-accent" : "text-muted"}`} />
      {isExpanded ? (
        <pre className="body-4 text-base whitespace-pre-wrap break-all">{expandedText}</pre>
      ) : (
        <span className="body-4 text-muted font-mono truncate">{collapsedText}</span>
      )}
    </button>
  );
}
