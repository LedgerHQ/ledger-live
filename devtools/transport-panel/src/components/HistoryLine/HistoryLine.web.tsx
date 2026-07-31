import type { Envelope, MessageMap } from "@devtools/transport";
import { ArrowUp, ArrowDown } from "@ledgerhq/lumen-ui-react/symbols";
import { useHistoryLine } from "../../hooks";

interface HistoryLineProps<M extends MessageMap> {
  readonly envelope: Envelope<M>;
  readonly localOrigin: string;
}

export function HistoryLine<M extends MessageMap>({ envelope, localOrigin }: HistoryLineProps<M>) {
  const { isExpanded, setIsExpanded, isSent, collapsedText, expandedText } = useHistoryLine(
    envelope,
    localOrigin,
  );
  const Arrow = isSent ? ArrowUp : ArrowDown;

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
