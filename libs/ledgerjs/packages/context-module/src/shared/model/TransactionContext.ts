export type TransactionContext = {
  challenge: string;
  chainId: number;
  to?: string;
  data?: string;
  domain?: string;
};
