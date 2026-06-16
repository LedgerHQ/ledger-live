import React, { useEffect, useReducer } from "react";
import {
  TroubleshootStatus,
  troubleshootOverObservable,
  troubleshootOverObservableReducer,
} from "@ledgerhq/live-common/network-troubleshooting/index";
import { Spinner, Tooltip, TooltipTrigger, TooltipContent } from "@ledgerhq/lumen-ui-react";
import { CheckmarkCircleFill, DeleteCircleFill } from "@ledgerhq/lumen-ui-react/symbols";
import { ToolPage } from "../components/ToolPage";

function useTroubleshootState() {
  const [state, dispatch] = useReducer(troubleshootOverObservableReducer, []);
  useEffect(() => {
    const s = troubleshootOverObservable().subscribe(dispatch);
    return () => s.unsubscribe();
  }, []);
  return state;
}

function App() {
  const state = useTroubleshootState();

  return (
    <ToolPage
      title="Network Troubleshooting"
      description="Diagnose connectivity and API reachability."
    >
      <div className="flex flex-col overflow-hidden rounded-lg border border-base bg-base">
        {state.map((s, i) => (
          <div
            key={s.title}
            className={`flex items-center justify-between gap-16 px-16 py-12 ${
              i > 0 ? "border-t border-base" : ""
            }`}
          >
            <span className="body-2 text-base">{s.title}</span>
            <Status status={s} />
          </div>
        ))}
        {state.length === 0 ? (
          <div className="px-16 py-12 body-2 text-muted">Running checks…</div>
        ) : null}
      </div>
    </ToolPage>
  );
}

const Status = ({ status }: { status: TroubleshootStatus }) => {
  switch (status?.status) {
    case "success":
      return <CheckmarkCircleFill size={20} className="text-success" />;
    case "error":
      return (
        <Tooltip>
          <TooltipTrigger aria-label="Show error details">
            <DeleteCircleFill size={20} className="text-error" />
          </TooltipTrigger>
          <TooltipContent>{status.error}</TooltipContent>
        </Tooltip>
      );
    default:
      return <Spinner size={20} className="text-muted" />;
  }
};

export default App;
