import type {
  FormattedValue,
  PayCardBalanceEmptyLabels,
  PayCardBalanceFilterLabels,
  PayCardBalanceFilterOption,
  PayCardBalanceLabels,
} from "../types";

export const emptyLabels: PayCardBalanceEmptyLabels = {
  emptyTitle: "Pay and get paid",
  emptyDescription: "Start by depositing stablecoin to your wallet",
};

export const filterLabels: PayCardBalanceFilterLabels = {
  allStablecoins: "All stablecoins",
  filterDialogTitle: "Filter balance",
  filterDialogDescription: "Select a stablecoin to filter your balance",
  filterDialogBanner: "USDC and USDT are always shown",
  confirm: "Confirm",
};

export const labels: PayCardBalanceLabels = {
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

export const depositActionTiles = {
  page: "Pay",
  tiles: [{ id: "deposit" as const, label: "Deposit", onPress: () => undefined }],
};

export const USDC_ID = "ethereum/erc20/usd__coin";
export const USDT_ID = "ethereum/erc20/usd_tether__erc20_";

export const allOption: PayCardBalanceFilterOption = {
  id: "all",
  title: "All stablecoins",
  countervalue: 1250,
  countervalueLabel: "$1,250.00",
};

export const usdcOption: PayCardBalanceFilterOption = {
  id: USDC_ID,
  title: "USD Coin",
  ticker: "USDC",
  ledgerId: USDC_ID,
  countervalue: 1000,
  countervalueLabel: "$1,000.00",
  cryptoAmountLabel: "1,000.00 USDC",
};

export const usdtOption: PayCardBalanceFilterOption = {
  id: USDT_ID,
  title: "Tether USD",
  ticker: "USDT",
  ledgerId: USDT_ID,
  countervalue: 250,
  countervalueLabel: "$250.00",
  cryptoAmountLabel: "250.00 USDT",
};

export const options: PayCardBalanceFilterOption[] = [allOption, usdcOption, usdtOption];
