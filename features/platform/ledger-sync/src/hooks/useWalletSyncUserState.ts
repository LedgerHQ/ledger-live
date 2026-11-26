import { useContext } from "react";
import type { WalletSyncUserState } from "@features/platform-wallet-sync";
import { WalletSyncContext } from "../walletSyncContext";

/** The watch loop state the app provides through `WalletSyncContext`. */
export function useWalletSyncUserState(): WalletSyncUserState {
  return useContext(WalletSyncContext);
}
