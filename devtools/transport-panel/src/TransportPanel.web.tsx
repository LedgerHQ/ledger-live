import { Divider } from "@ledgerhq/lumen-ui-react";
import { TransportStateIndicator } from "./components/TransportStateIndicator/TransportStateIndicator";
import { useSyncExternalStore, useState } from "react";
import { TransportPanelContent } from "./components/TransportPanelContent/TransportPanelContent.web";
import { ChevronDown, ChevronUp } from "@ledgerhq/lumen-ui-react/symbols";
import type { MessageMap } from "@devtools/transport";
import type { TransportPanelProps } from "./types";

export function TransportPanel<M extends MessageMap>(props: TransportPanelProps<M>) {
  const { transport } = props;
  const state = useSyncExternalStore(transport.subscribe, transport.getState, transport.getState);
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div>
      <Divider />
      <div className="flex flex-col">
        <button
          type="button"
          className="flex items-center justify-between px-2 transition-colors duration-150 hover:bg-muted-hover p-10"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(prev => !prev)}
        >
          <div className="flex items-center gap-8">
            <TransportStateIndicator transportState={state} />
            <span className="body-3 text-muted">WS</span>
            <span className="body-4 text-muted bg-muted rounded-full px-6 py-1">{props.role}</span>
          </div>
          {isExpanded ? (
            <ChevronDown size={16} className="text-muted" />
          ) : (
            <ChevronUp size={16} className="text-muted" />
          )}
        </button>
        {isExpanded && <TransportPanelContent transportConfig={props} />}
      </div>
    </div>
  );
}
