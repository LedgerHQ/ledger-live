import type { ConfidentialBalance } from "@ledgerhq/coin-evm/confidential";

export type SessionBalance = {
  balance: ConfidentialBalance;
  permitExpiresAt?: number;
  /** The address holding the private part: an unshield pays its public part. */
  owner?: string;
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
