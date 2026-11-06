import { useMemo } from "react";
import { getLkrpSdk } from "@features/platform-wallet-sync";
import { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useDispatch } from "LLD/hooks/redux";

export function useTrustchainSdk(): TrustchainSDK {
  const dispatch = useDispatch();
  return useMemo(() => getLkrpSdk(dispatch), [dispatch]);
}
