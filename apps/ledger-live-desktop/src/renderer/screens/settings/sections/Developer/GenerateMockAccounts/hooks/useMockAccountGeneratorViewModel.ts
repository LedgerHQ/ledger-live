import { useReducer, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { generateUnifiedAccounts, injectMockAccounts } from "../utils";
import type { MockAccountGeneratorViewModel } from "../types";

interface FormState {
  randomEnabled: boolean;
  randomCount: number;
  emptyEnabled: boolean;
  stablecoinsEnabled: boolean;
  manualEnabled: boolean;
  selectedCurrencies: Record<string, boolean>;
  tokenIds: string;
}

const initialState: FormState = {
  randomEnabled: false,
  randomCount: 10,
  emptyEnabled: false,
  stablecoinsEnabled: false,
  manualEnabled: false,
  selectedCurrencies: {},
  tokenIds: "",
};

type FormAction =
  | { type: "SET"; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: "TOGGLE_CURRENCY"; currencyId: string }
  | { type: "RESET" };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };
    case "TOGGLE_CURRENCY":
      return {
        ...state,
        selectedCurrencies: {
          ...state.selectedCurrencies,
          [action.currencyId]: !state.selectedCurrencies[action.currencyId],
        },
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

export const useMockAccountGeneratorViewModel = (): MockAccountGeneratorViewModel => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(formReducer, initialState);

  const set = useCallback(
    <K extends keyof FormState>(field: K) =>
      (value: FormState[K]) =>
        dispatch({ type: "SET", field, value }),
    [],
  );

  const selectedCount = useMemo(
    () => Object.values(state.selectedCurrencies).filter(Boolean).length,
    [state.selectedCurrencies],
  );

  const canGenerate =
    (state.randomEnabled && state.randomCount > 0) ||
    state.emptyEnabled ||
    state.stablecoinsEnabled ||
    (state.manualEnabled && selectedCount > 0);

  const summaryLines = useMemo(() => {
    const lines: string[] = [];
    if (state.randomEnabled && state.randomCount > 0) {
      lines.push(
        t("settings.developer.mockAccounts.summary.randomAccounts", { count: state.randomCount }),
      );
    }
    if (state.emptyEnabled) {
      lines.push(t("settings.developer.mockAccounts.summary.emptyAccount"));
    }
    if (state.stablecoinsEnabled) {
      lines.push(t("settings.developer.mockAccounts.summary.stablecoinAccounts"));
    }
    if (state.manualEnabled && selectedCount > 0) {
      lines.push(
        t("settings.developer.mockAccounts.summary.manualAccounts", { count: selectedCount }),
      );
    }
    return lines;
  }, [
    state.randomEnabled,
    state.randomCount,
    state.emptyEnabled,
    state.stablecoinsEnabled,
    state.manualEnabled,
    selectedCount,
    t,
  ]);

  const handleCurrencyToggle = useCallback(
    (currencyId: string) => dispatch({ type: "TOGGLE_CURRENCY", currencyId }),
    [],
  );

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    if (!globalThis.confirm(t("settings.developer.mockAccounts.alerts.confirmErase"))) return;

    try {
      const selectedCurrencyIds = Object.keys(state.selectedCurrencies).filter(
        id => state.selectedCurrencies[id],
      );

      const accounts = generateUnifiedAccounts({
        randomEnabled: state.randomEnabled,
        randomCount: state.randomCount,
        emptyEnabled: state.emptyEnabled,
        stablecoinsEnabled: state.stablecoinsEnabled,
        manualEnabled: state.manualEnabled,
        selectedCurrencyIds,
        tokenIds: state.tokenIds || undefined,
      });

      await injectMockAccounts(accounts, true);
      dispatch({ type: "RESET" });
    } catch (error) {
      console.error("Failed to generate mock accounts:", error);
      alert(t("settings.developer.mockAccounts.alerts.generateError"));
    }
  }, [canGenerate, state, t]);

  return {
    ...state,
    selectedCount,
    canGenerate,
    summaryLines,
    setRandomEnabled: set("randomEnabled"),
    setRandomCount: set("randomCount"),
    setEmptyEnabled: set("emptyEnabled"),
    setStablecoinsEnabled: set("stablecoinsEnabled"),
    setManualEnabled: set("manualEnabled"),
    setTokenIds: set("tokenIds"),
    handleCurrencyToggle,
    handleGenerate,
  };
};
