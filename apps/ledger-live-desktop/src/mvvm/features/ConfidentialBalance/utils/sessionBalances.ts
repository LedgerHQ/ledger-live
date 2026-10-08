import type { ConfidentialBalance } from "@ledgerhq/coin-evm/confidential";

export type SessionBalance = {
  balance: ConfidentialBalance;
  permitExpiresAt?: number;
};

const sessionBalances = new Map<string, SessionBalance>();

export const getSessionBalance = (accountId: string): SessionBalance | undefined =>
  sessionBalances.get(accountId);

export const setSessionBalance = (accountId: string, entry: SessionBalance): void => {
  sessionBalances.set(accountId, entry);
};

export const clearSessionBalances = (): void => {
  sessionBalances.clear();
};
