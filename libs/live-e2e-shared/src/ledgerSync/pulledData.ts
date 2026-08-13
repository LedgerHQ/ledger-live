import invariant from "invariant";

export interface LedgerSyncAccountData {
  id?: string;
  currencyId?: string;
  index?: number;
}

export interface LedgerSyncPulledData {
  updateEvent?: {
    data?: {
      accounts?: LedgerSyncAccountData[];
      accountNames?: Record<string, string>;
    };
  };
}

function parseLedgerSyncPulledData(pulledData: string | void): LedgerSyncPulledData {
  invariant(pulledData, "Ledger Sync: pulledData is undefined");
  try {
    const parsedData: LedgerSyncPulledData = JSON.parse(pulledData);
    return parsedData;
  } catch (error) {
    throw new Error(`Failed to parse pulledData: ${error}`, { cause: error });
  }
}

export function getTrustchainAccounts(pulledData: string | void): LedgerSyncAccountData[] {
  return parseLedgerSyncPulledData(pulledData).updateEvent?.data?.accounts ?? [];
}

/**
 * Returns `undefined` when the account still carries its default name: only names the user
 * customized are stored, defaults are derived from the currency and index at render time.
 */
export function getTrustchainAccountName(
  pulledData: string | void,
  accountId: string,
): string | undefined {
  return parseLedgerSyncPulledData(pulledData).updateEvent?.data?.accountNames?.[accountId];
}
