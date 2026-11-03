import type {
  AnalyticsCatalog,
  AnalyticsInitialSelection,
  AnalyticsMetric,
  AnalyticsSelection,
} from "../types";
import {
  DEFAULT_ANALYTICS_SELECTION,
  resolveAnalyticsSelection,
  resolveInitialAnalyticsSelection,
} from "../logic/resolveAnalyticsSelection";

export type AnalyticsSelectionState = Readonly<{
  selection: AnalyticsSelection;
  initialized: boolean;
}>;

export const INITIAL_ANALYTICS_SELECTION_STATE: AnalyticsSelectionState = {
  selection: DEFAULT_ANALYTICS_SELECTION,
  initialized: false,
};

export type AnalyticsSelectionAction =
  | Readonly<{
      type: "reconcile";
      catalog: AnalyticsCatalog;
      initialSelection?: AnalyticsInitialSelection;
    }>
  | Readonly<{ type: "selectAsset"; assetId: string | null; catalog: AnalyticsCatalog }>
  | Readonly<{ type: "selectAccount"; accountId: string | null; catalog: AnalyticsCatalog }>
  | Readonly<{ type: "selectMetric"; metric: AnalyticsMetric }>;

export function analyticsSelectionReducer(
  state: AnalyticsSelectionState,
  action: AnalyticsSelectionAction,
): AnalyticsSelectionState {
  let selection: AnalyticsSelection;
  switch (action.type) {
    case "reconcile":
      selection = state.initialized
        ? resolveAnalyticsSelection(state.selection, action.catalog)
        : {
            ...resolveInitialAnalyticsSelection(action.initialSelection, action.catalog),
            metric: state.selection.metric,
          };
      return state.initialized && selection === state.selection
        ? state
        : { selection, initialized: true };
    case "selectAsset":
      selection = resolveAnalyticsSelection(
        { ...state.selection, assetId: action.assetId },
        action.catalog,
      );
      break;
    case "selectAccount":
      selection = resolveAnalyticsSelection(
        { ...state.selection, accountId: action.accountId },
        action.catalog,
      );
      break;
    case "selectMetric":
      selection = { ...state.selection, metric: action.metric };
      return { selection, initialized: state.initialized };
  }
  return { selection, initialized: true };
}
