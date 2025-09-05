import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { isValidAddress } from "@celo/utils/lib/address";
import getFeesForTransaction from "./getFeesForTransaction";
import { CeloAccount, Transaction } from "../types";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { CELO_STABLE_TOKENS, MAX_PRIORITY_FEE_PER_GAS } from "../constants";
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

  const block = await kit.connection.web3.eth.getBlock("latest");
  const baseFee = BigInt(block.baseFeePerGas || MAX_PRIORITY_FEE_PER_GAS);
  const maxFeePerGas = baseFee + MAX_PRIORITY_FEE_PER_GAS;

  return {
    ...transaction,
    amount,
    fees,
    maxFeePerGas: maxFeePerGas.toString(),
    maxPriorityFeePerGas: await kit.connection.getMaxPriorityFeePerGas(),
    ...(isTokenTransaction
      ? {
          data: Buffer.from(
            token.transfer(transaction.recipient, amount.toFixed()).txo.encodeABI(),
          ),
        }
      : {}),
  };
};

export default prepareTransaction;
