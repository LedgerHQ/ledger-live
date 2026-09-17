import { useState, useCallback } from "react";
import type { GenerateByTypeOptions } from "../types";

interface Options {
  onGenerate: (options: GenerateByTypeOptions) => void | Promise<void>;
  stocksLoading: boolean;
  stablecoinsLoading: boolean;
}

export interface ByTypeSectionViewModel {
  includeCryptos: boolean;
  includeStablecoins: boolean;
  includeStocks: boolean;
  includeTestnet: boolean;
  countInput: string;
  isValid: boolean;
  isReady: boolean;
  onToggleCryptos: (v: boolean) => void;
  setIncludeStablecoins: (v: boolean) => void;
  setIncludeStocks: (v: boolean) => void;
  onToggleTestnet: (v: boolean) => void;
  setCountInput: (v: string) => void;
  onGenerate: () => void;
}

export function useByTypeSectionViewModel({
  onGenerate,
  stocksLoading,
  stablecoinsLoading,
}: Options): ByTypeSectionViewModel {
  const [includeCryptos, setIncludeCryptos] = useState(true);
  const [includeStablecoins, setIncludeStablecoins] = useState(true);
  const [includeStocks, setIncludeStocks] = useState(true);
  const [includeTestnet, setIncludeTestnet] = useState(false);
  const [countInput, setCountInput] = useState("10");

  const isValid = includeCryptos || includeStablecoins || includeStocks;
  const isReady =
    isValid &&
    (!includeStablecoins || !stablecoinsLoading) &&
    (!includeStocks || !stocksLoading);

  const onToggleCryptos = useCallback((v: boolean) => {
    setIncludeCryptos(v);
    if (!v) setIncludeTestnet(false);
  }, []);

  const onToggleTestnet = useCallback((v: boolean) => {
    setIncludeTestnet(v);
    if (v) setIncludeCryptos(true);
  }, []);

  const handleGenerate = useCallback(() => {
    const parsedCount = Number.parseInt(countInput, 10);
    const count = Math.max(1, Number.isNaN(parsedCount) ? 10 : parsedCount);
    void onGenerate({ includeCryptos, includeStablecoins, includeStocks, includeTestnet, count });
  }, [countInput, includeCryptos, includeStablecoins, includeStocks, includeTestnet, onGenerate]);

  return {
    includeCryptos,
    includeStablecoins,
    includeStocks,
    includeTestnet,
    countInput,
    isValid,
    isReady,
    onToggleCryptos,
    setIncludeStablecoins,
    setIncludeStocks,
    onToggleTestnet,
    setCountInput,
    onGenerate: handleGenerate,
  };
}
