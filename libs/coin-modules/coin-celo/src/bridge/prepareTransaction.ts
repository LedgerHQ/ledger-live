import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { isValidAddress } from "@celo/utils/lib/address";
import getFeesForTransaction from "./getFeesForTransaction";
import { CeloAccount, Transaction } from "../types";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { CELO_STABLE_TOKENS } from "../constants";
import { celoKit } from "../network/sdk";

export const prepareTransaction: AccountBridge<
  Transaction,
  CeloAccount
>["prepareTransaction"] = async (account, transaction) => {
  const kit = celoKit();

  if (transaction.recipient && !isValidAddress(transaction.recipient)) return transaction;

  if (["send", "vote"].includes(transaction.mode) && !transaction.recipient) return transaction;

  if (
    transaction.mode === "vote" &&
    !transaction.useAllAmount &&
    new BigNumber(transaction.amount).lte(0)
  )
    return transaction;

  const fees = await getFeesForTransaction({ account, transaction });

  const tokenAccount = findSubAccountById(account, transaction.subAccountId || "");
  const isTokenTransaction = tokenAccount?.type === "TokenAccount";

  const amount =
    transaction.useAllAmount && isTokenTransaction ? tokenAccount.balance : transaction.amount;

  let token;
  if (isTokenTransaction) {
    if (CELO_STABLE_TOKENS.includes(tokenAccount.token.id)) {
      token = await kit.contracts.getStableToken();
    } else {
      token = await kit.contracts.getErc20(tokenAccount.token.contractAddress);
    }
  } else {
    token = await kit.contracts.getGoldToken();
  }

  let data = token.transfer(transaction.recipient, amount.toFixed()).txo.encodeABI();

  // TESTING PURPOSES ONLY. DELETE
  const tetherContractAddress = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
  const _token = await kit.contracts.getErc20(tetherContractAddress);
  data = _token.transfer(transaction.recipient, amount.toFixed()).txo.encodeABI();

  return {
    ...transaction,
    fees,
    amount,
    data: Buffer.from(data.slice(2), "hex"),
  };
};

export default prepareTransaction;
