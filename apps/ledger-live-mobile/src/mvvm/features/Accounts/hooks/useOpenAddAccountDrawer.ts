import { useCallback } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useModularDrawerController } from "LLM/features/ModularDrawer";

type Props = {
  currency?: CryptoOrTokenCurrency;
  /**
   * Pre-selection list of ledger currency ids forwarded to the Modular Drawer.
   * When non-empty, takes priority over `currency` to pre-select every network
   * of a multi-network asset (e.g. USDT on Ethereum + Tron + others) so the
   * drawer can offer the network-selection step.
   */
  currencyIds?: string[];
  sourceScreenName: string;
};

/**
 * Opens the Modular Drawer for the add-account flow, mirroring
 * `useOpenReceiveDrawer`. Unlike receive, account selection is disabled so the
 * drawer routes to the device/add-account flow once an asset (and network when
 * relevant) is selected. A single-network asset (e.g. BTC) skips straight to
 * the device flow.
 */
export function useOpenAddAccountDrawer({ currency, currencyIds, sourceScreenName }: Props) {
  const { openDrawer } = useModularDrawerController();

  const handleOpenAddAccountDrawer = useCallback(() => {
    const hasCurrencyIds = !!currencyIds?.length;
    const currencies = hasCurrencyIds ? currencyIds : currency ? [currency.id] : [];
    return openDrawer({
      currencies,
      flow: "add_account",
      source: sourceScreenName,
      areCurrenciesFiltered: hasCurrencyIds || !!currency,
      enableAccountSelection: false,
    });
  }, [currency, currencyIds, sourceScreenName, openDrawer]);

  return {
    handleOpenAddAccountDrawer,
  };
}
