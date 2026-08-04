export type NonImportedAccountInfo = {
  id: string;
  attempts: number;
  attemptsLastTimestamp: number;
  error?: {
    name: string;
    message: string;
  };
};

/** Tracks accounts present in cloud sync but not yet imported locally. */
export type NonImportedAccountsState = NonImportedAccountInfo[];

export const initialNonImportedAccountsState: NonImportedAccountsState = [];
