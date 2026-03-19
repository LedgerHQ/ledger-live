import { AccountLike, AnyMessage } from "@ledgerhq/types-live";
import { getAccountIdFromWalletAccountId } from "../converters";
import { isAccount } from "../../account/index";
import { prepareMessageToSign } from "../../hw/signMessage/index";
import { WalletAPIContext } from "./context";

export function signMessageLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  message: string,
  uiNavigation: (account: AccountLike, message: AnyMessage) => Promise<Buffer>,
): Promise<Buffer> {
  tracking.signMessageRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.signMessageFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

  const account = accounts.find(account => account.id === accountId);
  if (account === undefined) {
    tracking.signMessageFail(manifest);
    return Promise.reject(new Error("account not found"));
  }

  let formattedMessage: AnyMessage;
  try {
    if (isAccount(account)) {
      formattedMessage = prepareMessageToSign(account, message);
    } else {
      throw new Error("account provided should be the main one");
    }
  } catch (error) {
    tracking.signMessageFail(manifest);
    return Promise.reject(error);
  }

  return uiNavigation(account, formattedMessage);
}
