import { AccountBridge, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { estimateFees } from "../logic/estimateFees";
import { getCalTokensCached } from "../network/gateway";
import { Transaction } from "../types";
import { getBridgeConfig, getBridgeContext } from "./context";
import { updateTransaction } from "./updateTransaction";

type CantonTokenAccount = TokenAccount & {
  cantonResources: { instrumentAdmin: string };
};

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const amount = transaction.amount || BigNumber(0);
  const fee = BigNumber(
    (await estimateFees(getBridgeContext(account.currency), BigInt(amount.toFixed()))).toString(),
  );

  let tokenId = transaction.tokenId;
  let instrumentAdmin: string | undefined;
  if (transaction.subAccountId && account.subAccounts) {
    const subAccount = account.subAccounts.find(
      (sub): sub is CantonTokenAccount =>
        sub.type === "TokenAccount" && sub.id === transaction.subAccountId,
    );
    if (subAccount) {
      const calTokens = await getCalTokensCached(account.currency.id);
      tokenId = calTokens.get(subAccount.token.id) || subAccount.token.name;
      instrumentAdmin = subAccount.token.contractAddress;
    }
  }

  // Default to native instrument if no tokenId set
  if (!tokenId) {
    tokenId = getBridgeConfig(account.currency).nativeInstrumentId;
  }

  return updateTransaction(transaction, {
    fee,
    tokenId,
    ...(instrumentAdmin ? { instrumentAdmin } : {}),
  });
};
