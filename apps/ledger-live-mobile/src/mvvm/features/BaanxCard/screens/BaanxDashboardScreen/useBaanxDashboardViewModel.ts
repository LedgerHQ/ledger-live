import { useState, useCallback, useMemo } from "react";
import { useModularDrawerController } from "~/mvvm/features/ModularDrawer/hooks/useModularDrawerController";
import { useToggleDiscreetMode } from "~/hooks/useToggleDiscreetMode";
import { useCategorizedAssetsFromPortfolio } from "~/mvvm/hooks/useCategorizedAssetsFromPortfolio";
import { useDefaultAssetsByCategory } from "~/mvvm/hooks/useDefaultAssetsByCategory";
import type { CardData, TransactionItem } from "./mockData";
import { MOCK_CARD, MOCK_TRANSACTIONS, MOCK_TOTAL_BALANCE, MOCK_CASHBACK } from "./mockData";

const MAX_STABLECOINS = 5;
const SMART_PAY_ID = "smart-pay";
const TOP_UP_CURRENCIES = ["ethereum", "bitcoin"];

export interface StablecoinOption {
  readonly id: string;
  readonly ticker: string;
  readonly name: string;
}

export interface BaanxDashboardViewModel {
  readonly selectedCurrency: string;
  readonly setSelectedCurrency: (code: string) => void;

  readonly card: CardData;
  readonly totalBalance: string;
  readonly cashback: string;
  readonly discreetMode: boolean;
  readonly onToggleDiscreet: () => void;
  readonly onTopUp: () => void;

  readonly selectedPaymentId: string;
  readonly onSelectPayment: (id: string) => void;
  readonly stablecoins: readonly StablecoinOption[];
  readonly isSmartPaySheetOpen: boolean;
  readonly onOpenSmartPaySheet: () => void;
  readonly onCloseSmartPaySheet: () => void;

  readonly transactions: readonly TransactionItem[];
}

export function useBaanxDashboardViewModel(): BaanxDashboardViewModel {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  // --- Balance / discreet mode ---
  const { discreetMode, toggleDiscreetMode } = useToggleDiscreetMode();
  const { openDrawer } = useModularDrawerController();

  const onTopUp = useCallback(() => {
    openDrawer({
      currencies: TOP_UP_CURRENCIES,
      areCurrenciesFiltered: true,
      enableAccountSelection: true,
      source: "BaanxCard",
      flow: "baanx-top-up",
    });
  }, [openDrawer]);

  // --- Pay with ---
  const [selectedPaymentId, setSelectedPaymentId] = useState(SMART_PAY_ID);
  const [isSmartPaySheetOpen, setIsSmartPaySheetOpen] = useState(false);

  const onSelectPayment = useCallback((id: string) => {
    setSelectedPaymentId(id);
    if (id === SMART_PAY_ID) {
      setIsSmartPaySheetOpen(true);
    }
  }, []);

  const onOpenSmartPaySheet = useCallback(() => {
    setSelectedPaymentId(SMART_PAY_ID);
    setIsSmartPaySheetOpen(true);
  }, []);

  const onCloseSmartPaySheet = useCallback(() => {
    setIsSmartPaySheetOpen(false);
  }, []);

  const { categorizedAssets, stablecoinTickers } = useCategorizedAssetsFromPortfolio();

  const portfolioStablecoins: readonly StablecoinOption[] = useMemo(
    () =>
      categorizedAssets.stablecoins.map(({ currency }) => ({
        id: currency.id,
        ticker: currency.ticker,
        name: currency.name,
      })),
    [categorizedAssets.stablecoins],
  );

  const needsDefaults = portfolioStablecoins.length === 0;
  const { stablecoins: defaultStablecoins } = useDefaultAssetsByCategory(
    needsDefaults,
    stablecoinTickers,
    0,
    MAX_STABLECOINS,
  );

  const stablecoins: readonly StablecoinOption[] = useMemo(() => {
    if (portfolioStablecoins.length > 0) return portfolioStablecoins;
    return defaultStablecoins.map(({ currency }) => ({
      id: currency.id,
      ticker: currency.ticker,
      name: currency.name,
    }));
  }, [portfolioStablecoins, defaultStablecoins]);

  return {
    selectedCurrency,
    setSelectedCurrency,
    card: MOCK_CARD,
    totalBalance: MOCK_TOTAL_BALANCE,
    cashback: MOCK_CASHBACK,
    discreetMode,
    onToggleDiscreet: toggleDiscreetMode,
    onTopUp,
    selectedPaymentId,
    onSelectPayment,
    stablecoins,
    isSmartPaySheetOpen,
    onOpenSmartPaySheet,
    onCloseSmartPaySheet,
    transactions: MOCK_TRANSACTIONS,
  };
}
