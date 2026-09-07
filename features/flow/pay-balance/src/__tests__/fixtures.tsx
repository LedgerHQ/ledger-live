import type { ActionTilesProps } from "../components/ActionTiles/types";
import type {
  FormattedValue,
  BalanceEmptyLabels,
  BalanceFilterLabels,
  BalanceFilterOption,
  BalanceLabels,
} from "../types";

export const emptyLabels: BalanceEmptyLabels = {
  emptyTitle: "Pay and get paid",
  emptyDescription: "Start by depositing stablecoin to your wallet",
};

export const filterLabels: BalanceFilterLabels = {
  allStablecoins: "All stablecoins",
  filterDialogTitle: "Filter balance",
  filterDialogDescription: "Select a stablecoin to filter your balance",
  filterDialogBanner: "USDC and USDT are always shown",
  confirm: "Confirm",
};

export const labels: BalanceLabels = {
  ...emptyLabels,
  ...filterLabels,
};

export const formatCountervalue = (value: number): FormattedValue => ({
  integerPart: String(value),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

export const fundedStateProps = {
  balance: 1000,
  formatCountervalue,
  isLoading: false,
  allStablecoinsLabel: filterLabels.allStablecoins,
  onOpenFilter: () => undefined,
};

export const depositActionTiles: ActionTilesProps = {
  page: "Pay",
  tiles: [{ id: "deposit", onPress: () => undefined, appearance: "base" }],
};

export const BALANCE_RESOURCES = {
  en: {
    translation: {
      payTab: {
        balance: {
          emptyTitle: "Pay and get paid",
          emptyDescription: "Start by depositing stablecoin to your wallet",
          filter: {
            allStablecoins: "All stablecoins",
            dialogTitle: "Filter balance",
            dialogDescription: "Select a stablecoin to filter your balance",
            dialogBanner: "USDC and USDT are always shown",
            confirm: "Confirm",
          },
        },
        actions: {
          deposit: "Add stablecoin",
          request: "Request",
          pay: "New payment",
        },
      },
    },
  },
};

export const USDC_ID = "ethereum/erc20/usd__coin";
export const USDT_ID = "ethereum/erc20/usd_tether__erc20_";

export const allOption: BalanceFilterOption = {
  id: "all",
  title: "All stablecoins",
  countervalue: 1250,
  countervalueLabel: "$1,250.00",
};

export const usdcOption: BalanceFilterOption = {
  id: USDC_ID,
  title: "USD Coin",
  ticker: "USDC",
  ledgerId: USDC_ID,
  countervalue: 1000,
  countervalueLabel: "$1,000.00",
  cryptoAmountLabel: "1,000.00 USDC",
};

export const usdtOption: BalanceFilterOption = {
  id: USDT_ID,
  title: "Tether USD",
  ticker: "USDT",
  ledgerId: USDT_ID,
  countervalue: 250,
  countervalueLabel: "$250.00",
  cryptoAmountLabel: "250.00 USDT",
};

export const options: BalanceFilterOption[] = [allOption, usdcOption, usdtOption];
