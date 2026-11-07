import { useMemo } from "react";
import type { AccountDataUiHook } from "@features/platform-wallet-api-server";
import { app } from "~/renderer/bridge";
import { useDispatch } from "LLD/hooks/redux";
import { setPendingSignRequest } from "../pendingSignRequest";
import { openWalletApiAccountDataSignDialog } from "../walletApiAccountDataSignDialog";

/** The screens the Wallet API account data handlers open to sign or receive. */
export function useAccountDataUiHook(): AccountDataUiHook {
  const dispatch = useDispatch();
  return useMemo(
    () => ({
      "transaction.sign": params => {
        app.show();
        setPendingSignRequest({ kind: "transaction", params });
        dispatch(openWalletApiAccountDataSignDialog());
      },
      "message.sign": params => {
        app.show();
        setPendingSignRequest({ kind: "message", params });
        dispatch(openWalletApiAccountDataSignDialog());
      },
      "account.receive": params => {
        app.show();
        setPendingSignRequest({ kind: "receive", params });
        dispatch(openWalletApiAccountDataSignDialog());
      },
    }),
    [dispatch],
  );
}
