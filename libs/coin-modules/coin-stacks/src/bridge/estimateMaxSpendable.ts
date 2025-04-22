import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import {
  UnsignedTokenTransferOptions,
  estimateTransaction,
  estimateTransactionByteLength,
  makeUnsignedSTXTokenTransfer,
  makeUnsignedContractCall,
  uintCV,
  standardPrincipalCV,
  someCV,
  stringAsciiCV,
  noneCV,
} from "@stacks/transactions";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { StacksNetwork } from "../network/api.types";
import { Transaction } from "../types";
import { createTransaction } from "./createTransaction";
import { getAccountInfo } from "./utils/account";
import { getAddress } from "./utils/misc";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const { mainAccount, subAccount, tokenAccountTxn } = getAccountInfo({
    account,
    parentAccount,
    transaction,
  });

  const { address } = getAddress(account as Account);
  const { spendableBalance, xpub } = mainAccount;
  invariant(xpub, "xpub is required");

  // If it's a token transaction, return the token's spendable balance
  if (tokenAccountTxn && subAccount) {
    return subAccount.spendableBalance;
  }

  const dummyTx = {
    ...createTransaction(account),
    ...transaction,
    recipient: getAbandonSeedAddress(mainAccount.currency.id),
    useAllAmount: true,
  };

  // Compute fees
  const { recipient, anchorMode, memo, amount } = dummyTx;
  const network = StacksNetwork[dummyTx.network] || StacksNetwork["mainnet"];

  let tx;
  if (tokenAccountTxn && subAccount) {
    // Token transfer transaction
    const contractAddress = subAccount?.token.contractAddress;
    const contractName = subAccount?.token.id.split("/").pop() ?? "";

    // Create the function arguments for the SIP-010 transfer function
    const functionArgs = [
      uintCV(amount.toString()), // Amount
      standardPrincipalCV(address), // Sender
      standardPrincipalCV(recipient), // Recipient
      memo ? someCV(stringAsciiCV(memo)) : noneCV(), // Memo (optional)
    ];

    tx = await makeUnsignedContractCall({
      contractAddress,
      contractName,
      functionName: "transfer",
      functionArgs,
      anchorMode,
      network,
      publicKey: xpub,
    });
  } else {
    // Regular STX transfer
    const options: UnsignedTokenTransferOptions = {
      recipient,
      anchorMode,
      memo,
      network,
      publicKey: xpub,
      amount: amount.toFixed(),
    };

    tx = await makeUnsignedSTXTokenTransfer(options);
  }

  const [feeEst] = await estimateTransaction(
    tx.payload,
    estimateTransactionByteLength(tx),
    network,
  );

  const diff = spendableBalance.minus(new BigNumber(feeEst.fee));
  return diff.gte(0) ? diff : new BigNumber(0);
};
