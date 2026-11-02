import { useRef, useState } from "react";
import type {
  AccountPortfolioAction,
  AccountPortfolioRequest,
  AccountPortfolioResult,
  AccountPortfolioToolProps,
  Run,
} from "../types";
import { mergeHistoryPages } from "../utils/historyPages";

const HISTORY_SIZE = 50;

export interface RunHistoryViewModel {
  readonly history: readonly Run[];
  readonly selected: Run | undefined;
  readonly running: AccountPortfolioAction | undefined;
  /** What `pageToken` takes to read the page after the selected history; absent on the last. */
  readonly nextHistoryToken: string | undefined;
  /** Calls the service, records the answer and selects it. */
  readonly run: (request: AccountPortfolioRequest) => Promise<void>;
  /** Reads the page after the selected history and adds it to that result. */
  readonly loadMore: () => Promise<void>;
  readonly select: (id: number) => void;
  readonly clear: () => void;
}

/** The calls of this session and the one on display: the host is only reached through `onRun`. */
export function useRunHistory(onRun: AccountPortfolioToolProps["onRun"]): RunHistoryViewModel {
  const [history, setHistory] = useState<Run[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [running, setRunning] = useState<AccountPortfolioAction>();
  const nextRunId = useRef(0);

  const selected = history.find(entry => entry.id === selectedId) ?? history[0];
  const selectedView = selected?.result.ok ? selected.result.view : undefined;
  const nextHistoryToken = selectedView?.kind === "history" ? selectedView.nextToken : undefined;

  const recordRun = (request: AccountPortfolioRequest, result: AccountPortfolioResult) => {
    nextRunId.current += 1;
    const entry: Run = {
      id: nextRunId.current,
      action: request.action,
      portfolioId: request.portfolioId,
      at: Date.now(),
      request,
      result,
    };
    setHistory(previous => [entry, ...previous].slice(0, HISTORY_SIZE));
    setSelectedId(entry.id);
  };

  /** Runs one callHost, showing `running` for as long as it takes. A host that rejects is a failure. */
  const callHost = async (request: AccountPortfolioRequest): Promise<AccountPortfolioResult> => {
    setRunning(request.action);
    const startedAt = Date.now();
    try {
      return await onRun(request);
    } catch (error) {
      return {
        ok: false,
        durationMs: Date.now() - startedAt,
        sent: { method: "", url: "" },
        body: error instanceof Error ? { name: error.name, message: error.message } : error,
        currency: request.currency,
      };
    } finally {
      setRunning(undefined);
    }
  };

  const run = async (request: AccountPortfolioRequest) => {
    recordRun(request, await callHost(request));
  };

  const loadMore = async () => {
    if (!selected || !nextHistoryToken || running) return;
    const request = { ...selected.request, pageToken: nextHistoryToken };
    const result = await callHost(request);
    const before = selected.result.view;
    const after = result.view;
    if (!result.ok || before?.kind !== "history" || after?.kind !== "history") {
      recordRun(request, result);
      return;
    }
    // The pages read so far stay one result: the new one grows it, and its token moves on.
    const merged = {
      ...result,
      durationMs: selected.result.durationMs + result.durationMs,
      view: mergeHistoryPages(before, after),
    };
    setHistory(previous =>
      previous.map(entry => (entry.id === selected.id ? { ...entry, result: merged } : entry)),
    );
  };

  return {
    history,
    selected,
    running,
    nextHistoryToken,
    run,
    loadMore,
    select: setSelectedId,
    clear: () => {
      setHistory([]);
      setSelectedId(undefined);
    },
  };
}
