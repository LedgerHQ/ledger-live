export interface AccountResult {
  name: string;
  currency: string;
  balance: string;
  threshold: string;
  freshAddress: string;
  isLow: boolean;
  decimals: number;
  ticker: string;
  error?: string;
}

export interface FundReport {
  date: string;
  hasAlerts: boolean;
  accounts: AccountResult[];
}
