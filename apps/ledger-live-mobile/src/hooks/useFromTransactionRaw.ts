import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import { useEffect, useState } from "react";

type TransactionRaw = Parameters<typeof fromTransactionRaw>[0];
type Transaction = Awaited<ReturnType<typeof fromTransactionRaw>>;

export function useFromTransactionRaw<T extends Transaction = Transaction>(
  transactionRaw: TransactionRaw | undefined,
): T | undefined {
  const [transaction, setTransaction] = useState<T | undefined>(undefined);
  useEffect(() => {
    if (!transactionRaw) return;
    let cancelled = false;
    fromTransactionRaw(transactionRaw).then(tx => {
      if (!cancelled) setTransaction(tx as T);
    });
    return () => {
      cancelled = true;
    };
  }, [transactionRaw]);
  return transaction;
}
