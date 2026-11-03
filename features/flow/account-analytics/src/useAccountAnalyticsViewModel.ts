import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createAnalyticsCatalogKey } from "./logic/createAnalyticsCatalogKey";
import { createAnalyticsQueryKey } from "./logic/createAnalyticsQueryContext";
import {
  resolveAnalyticsSelection,
  resolveInitialAnalyticsSelection,
} from "./logic/resolveAnalyticsSelection";
import {
  selectAnalyticsAccounts,
  selectAnalyticsPositions,
} from "./logic/selectAnalyticsPositions";
import {
  analyticsSelectionReducer,
  INITIAL_ANALYTICS_SELECTION_STATE,
} from "./state/analyticsSelectionReducer";
import type {
  AccountAnalyticsDataPort,
  AccountAnalyticsViewModel,
  AnalyticsBalanceData,
  AnalyticsMetric,
  AnalyticsQueryContext,
  AnalyticsResultState,
  UseAccountAnalyticsViewModelProps,
} from "./types";

type BalanceRequestState = Readonly<{
  key: string;
  context: AnalyticsQueryContext;
  attempt: number;
  load: AccountAnalyticsDataPort["loadBalance"];
  result: AnalyticsResultState<AnalyticsBalanceData>;
}>;

const LOADING = { status: "loading" } as const;

export function useAccountAnalyticsViewModel({
  catalog,
  fiatCurrencyId,
  period,
  initialSelection,
  dataPort: { loadBalance },
}: UseAccountAnalyticsViewModelProps): AccountAnalyticsViewModel {
  const incomingCatalog = catalog.status === "ready" ? catalog.data : undefined;
  const incomingCatalogKey = incomingCatalog
    ? createAnalyticsCatalogKey(incomingCatalog)
    : undefined;
  const [catalogSnapshot, setCatalogSnapshot] = useState(() => ({
    key: incomingCatalogKey,
    data: incomingCatalog,
  }));
  if (incomingCatalog && incomingCatalogKey !== catalogSnapshot.key) {
    setCatalogSnapshot({ key: incomingCatalogKey, data: incomingCatalog });
  }
  const readyCatalog = catalog.status === "ready" ? catalogSnapshot.data : undefined;
  const availableCatalog = catalogSnapshot.data;
  const [state, dispatch] = useReducer(
    analyticsSelectionReducer,
    INITIAL_ANALYTICS_SELECTION_STATE,
  );
  const [entry] = useState(initialSelection);
  const generation = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const [request, setRequest] = useState<BalanceRequestState | null>(null);
  const selection = useMemo(() => {
    if (!readyCatalog) return state.selection;
    return state.initialized
      ? resolveAnalyticsSelection(state.selection, readyCatalog)
      : {
          ...resolveInitialAnalyticsSelection(entry, readyCatalog),
          metric: state.selection.metric,
        };
  }, [readyCatalog, state, entry]);
  const { assetId, accountId } = selection;
  const positions = useMemo(
    () => (readyCatalog ? selectAnalyticsPositions(readyCatalog, { assetId, accountId }) : []),
    [readyCatalog, assetId, accountId],
  );
  const positionIds = useMemo(() => positions.map(position => position.positionId), [positions]);
  const context = useMemo<AnalyticsQueryContext>(
    () => ({
      ...selection,
      fiatCurrencyId,
      period,
      positionIds,
    }),
    [selection, fiatCurrencyId, period, positionIds],
  );
  const contextKey = createAnalyticsQueryKey(context);
  if (readyCatalog && (!state.initialized || selection !== state.selection)) {
    dispatch({ type: "reconcile", catalog: readyCatalog, initialSelection: entry });
  }

  useEffect(() => {
    if (catalog.status !== "ready") return;
    const controller = new AbortController();
    const requestId = ++generation.current;
    const pending = { key: contextKey, context, attempt, load: loadBalance };
    async function readBalance() {
      try {
        const result = await loadBalance(context, { signal: controller.signal });
        if (!controller.signal.aborted && generation.current === requestId) {
          setRequest({ ...pending, result });
        }
      } catch {
        if (!controller.signal.aborted && generation.current === requestId) {
          setRequest({ ...pending, result: { status: "error" } });
        }
      }
    }
    void readBalance();
    return () => controller.abort();
  }, [context, contextKey, loadBalance, attempt, catalog.status]);

  const selectAsset = useCallback(
    (assetId: string | null) => {
      if (availableCatalog) dispatch({ type: "selectAsset", assetId, catalog: availableCatalog });
    },
    [availableCatalog],
  );
  const selectAccount = useCallback(
    (accountId: string | null) => {
      if (availableCatalog)
        dispatch({ type: "selectAccount", accountId, catalog: availableCatalog });
    },
    [availableCatalog],
  );
  const selectMetric = useCallback(
    (metric: AnalyticsMetric) => dispatch({ type: "selectMetric", metric }),
    [],
  );
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  let balance: AnalyticsResultState<AnalyticsBalanceData> = LOADING;
  if (catalog.status === "error") {
    balance = { status: "error" };
  } else if (
    catalog.status === "ready" &&
    request?.key === contextKey &&
    request.context === context &&
    request.attempt === attempt &&
    request.load === loadBalance
  ) {
    balance = request.result;
  }
  const accounts = useMemo(
    () => (availableCatalog ? selectAnalyticsAccounts(availableCatalog, selection.assetId) : []),
    [availableCatalog, selection.assetId],
  );

  return {
    selection,
    context,
    contextKey,
    balance,
    assets: availableCatalog?.assets ?? [],
    accounts,
    selectAsset,
    selectAccount,
    selectMetric,
    retry,
  };
}
