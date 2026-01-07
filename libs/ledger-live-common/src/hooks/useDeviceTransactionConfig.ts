import { useState, useEffect } from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "../generated/types";
import {
  getDeviceTransactionConfig,
  DeviceTransactionField,
} from "../transaction/deviceTransactionConfig";

type UseDeviceTransactionConfigParams = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
};

/**
 * Hook to fetch device transaction configuration fields asynchronously.
 * This anticipates the future async nature of crypto assets store operations.
 */
export function useDeviceTransactionConfig({
  account,
  parentAccount,
  transaction,
  status,
}: UseDeviceTransactionConfigParams): {
  fields: DeviceTransactionField[];
  loading: boolean;
} {
  const [fields, setFields] = useState<DeviceTransactionField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadFields() {
      try {
        setLoading(true);
        const result = await getDeviceTransactionConfig({
          account,
          parentAccount,
          transaction,
          status,
        });
        if (mounted) {
          setFields(result);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load device transaction config:", error);
        if (mounted) {
          setFields([]);
          setLoading(false);
        }
      }
    }

    loadFields();

    return () => {
      mounted = false;
    };
  }, [account, parentAccount, transaction, status]);

  return { fields, loading };
}
