import { useState, useCallback, useMemo } from "react";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { GenerateByCurrencyOptions, GenerateEmptyOptions } from "../types";

const ALL_CURRENCIES = listSupportedCurrencies().sort((a, b) => a.name.localeCompare(b.name));

export const ACCOUNTS_PER_CURRENCY_PICKS = ["1", "2", "5", "10", "25", "50", "100"] as const;

interface Options {
  onGenerateByCurrency: (opts: GenerateByCurrencyOptions) => void | Promise<void>;
  onGenerateEmpty: (opts: GenerateEmptyOptions) => void | Promise<void>;
}

export interface ByCurrencySectionViewModel {
  currencySearch: string;
  setCurrencySearch: (v: string) => void;
  tokenInput: string;
  setTokenInput: (v: string) => void;
  accountsPerCurrency: number;
  setAccountsPerCurrency: (v: number) => void;
  filteredCurrencies: CryptoCurrency[];
  selectedIds: Set<string>;
  selectedCount: number;
  totalAccounts: number;
  toggleCurrency: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  handleByCurrency: () => void;
  handleGenerateEmpty: () => void;
}

export function useByCurrencySectionViewModel({
  onGenerateByCurrency,
  onGenerateEmpty,
}: Options): ByCurrencySectionViewModel {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currencySearch, setCurrencySearch] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [accountsPerCurrency, setAccountsPerCurrency] = useState(1);

  const filteredCurrencies = useMemo(() => {
    const q = currencySearch.trim().toLowerCase();
    return q
      ? ALL_CURRENCIES.filter(
          c => c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q),
        )
      : ALL_CURRENCIES;
  }, [currencySearch]);

  const resolvedTokenIds = useMemo(
    () =>
      tokenInput
        .split(",")
        .map(t => t.toLowerCase().trim())
        .filter(Boolean),
    [tokenInput],
  );

  const toggleCurrency = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredCurrencies.map(c => c.id)));
  }, [filteredCurrencies]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleByCurrency = useCallback(() => {
    if (selectedIds.size === 0) return;
    void onGenerateByCurrency({
      currencyIds: Array.from(selectedIds),
      tokenIds: resolvedTokenIds,
      accountsPerCurrency,
    });
  }, [onGenerateByCurrency, selectedIds, resolvedTokenIds, accountsPerCurrency]);

  const handleGenerateEmpty = useCallback(() => {
    if (selectedIds.size === 0) return;
    void onGenerateEmpty({ currencyIds: Array.from(selectedIds), accountsPerCurrency });
  }, [onGenerateEmpty, selectedIds, accountsPerCurrency]);

  const selectedCount = selectedIds.size;
  const totalAccounts = selectedCount * accountsPerCurrency;

  return {
    currencySearch,
    setCurrencySearch,
    tokenInput,
    setTokenInput,
    accountsPerCurrency,
    setAccountsPerCurrency,
    filteredCurrencies,
    selectedIds,
    selectedCount,
    totalAccounts,
    toggleCurrency,
    selectAll,
    clearSelection,
    handleByCurrency,
    handleGenerateEmpty,
  };
}
