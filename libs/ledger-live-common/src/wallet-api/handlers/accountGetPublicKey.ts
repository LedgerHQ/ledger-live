import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import { accountGetPublicKeyLogic } from "../logic/accountGetPublicKey";
import { getAccountIdFromWalletAccountId } from "../converters";
import { getParentAccount } from "../../account/index";
import { AccountPublicKeyUnavailable } from "../../errors";
import type { HandlerDeps } from "./types";

export function createAccountGetPublicKeyHandler(
  getDeps: () => HandlerDeps,
): WalletHandlers["account.getPublicKey"] {
  return async ({ accountId }) => {
    const { manifest, accounts, tracking, uiAccountPublicKeyUnavailable } = getDeps();
    try {
      return await accountGetPublicKeyLogic({ manifest, accounts, tracking }, accountId);
    } catch (error) {
      // Surface a native message, then let the RPC reject as before. Match by name (not just
      // instanceof, per createCustomErrorClass) so it holds even if the error loses its
      // prototype (e.g. serialized to a plain object across a transport).
      const isPublicKeyUnavailable =
        error instanceof AccountPublicKeyUnavailable ||
        (typeof error === "object" &&
          error !== null &&
          (error as { name?: unknown }).name === "AccountPublicKeyUnavailable");
      if (isPublicKeyUnavailable && uiAccountPublicKeyUnavailable) {
        try {
          const localAccountId = getAccountIdFromWalletAccountId(accountId);
          const account = localAccountId ? accounts.find(a => a.id === localAccountId) : undefined;
          if (account) {
            uiAccountPublicKeyUnavailable({
              account,
              // getParentAccount returns the account itself for a main account; a real parent
              // only exists for token accounts.
              parentAccount:
                account.type === "TokenAccount" ? getParentAccount(account, accounts) : undefined,
            });
          }
        } catch {
          // Best-effort native prompt: never let a UI failure replace the original RPC rejection.
        }
      }
      throw error;
    }
  };
}
