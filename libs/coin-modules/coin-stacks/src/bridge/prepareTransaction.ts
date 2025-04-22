import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AccountBridge } from "@ledgerhq/types-live";
import {
  AddressVersion,
  TransactionVersion,
  UnsignedTokenTransferOptions,
  ClarityValue,
  estimateTransaction,
  estimateTransactionByteLength,
  makeUnsignedSTXTokenTransfer,
  makeUnsignedContractCall,
  uintCV,
  standardPrincipalCV,
  someCV,
  stringAsciiCV,
  noneCV,
  StacksMessageType,
  PostConditionType,
  createStandardPrincipal,
  FungibleConditionCode,
  createAssetInfo,
} from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { c32address } from "c32check";
import invariant from "invariant";
import { StacksNetwork } from "../network/api.types";
import { Transaction } from "../types";
import { validateAddress } from "./utils/addresses";
import { findNextNonce, getAddress } from "./utils/misc";
import { getSubAccount } from "./utils/token";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const { address } = getAddress(account); 
  const { spendableBalance, pendingOperations, xpub } = account;
  const { recipient, useAllAmount } = transaction;
  invariant(xpub, "xpub is required");

  const patch: Partial<Transaction> = {};

  if (xpub && recipient && validateAddress(recipient).isValid) {
    const { anchorMode, memo, amount } = transaction;
    const network = StacksNetwork[transaction.network] || StacksNetwork["mainnet"];
    const addressVersion =
      network.version === TransactionVersion.Mainnet
        ? AddressVersion.MainnetSingleSig
        : AddressVersion.TestnetSingleSig;

    // Check if this is a token transaction
    const subAccount = getSubAccount(account, transaction);
    const tokenAccountTxn = !!subAccount;

    // Handle different transaction types
    if (tokenAccountTxn) {
      // Token transfer transaction
      const contractAddress = subAccount?.token.contractAddress;
      const contractName = subAccount?.token.id.split(".").pop()?.split("::")[0] ?? "";
      const assetName = subAccount?.token.id.split(".").pop()?.split("::")[1] ?? "";

      // Create contract call for token transfer
      const functionArgs: ClarityValue[] = [
        uintCV(amount.toFixed()), // Amount
        standardPrincipalCV(address), // Sender
        standardPrincipalCV(recipient), // Recipient
        memo ? someCV(stringAsciiCV(memo)) : noneCV(), // Memo (optional)
      ];

      const tx = await makeUnsignedContractCall({
        contractAddress,
        contractName,
        functionName: "transfer",
        functionArgs,
        anchorMode,
        network,
        publicKey: xpub,
        postConditions: [
          {
            type: StacksMessageType.PostCondition,
            conditionType: PostConditionType.Fungible,
            principal: createStandardPrincipal(address),
            conditionCode: FungibleConditionCode.Equal,
            amount: BigInt(amount.toFixed()),
            assetInfo: createAssetInfo(contractAddress, contractName, assetName),
          },
        ],
      });

      const senderAddress = c32address(addressVersion, tx.auth.spendingCondition!.signer);

      const [fee] = await estimateTransaction(
        tx.payload,
        estimateTransactionByteLength(tx),
        network,
      );

      patch.fee = new BigNumber(fee.fee);
      patch.nonce = await findNextNonce(senderAddress, pendingOperations);

      // For token transfers, amount depends on useAllAmount
      if (useAllAmount) {
        patch.amount = subAccount.spendableBalance;
      }
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

      const tx = await makeUnsignedSTXTokenTransfer(options);

      const senderAddress = c32address(addressVersion, tx.auth.spendingCondition!.signer);

      const [fee] = await estimateTransaction(
        tx.payload,
        estimateTransactionByteLength(tx),
        network,
      );

      patch.fee = new BigNumber(fee.fee);
      patch.nonce = await findNextNonce(senderAddress, pendingOperations);

      if (useAllAmount) patch.amount = spendableBalance.minus(patch.fee);
    }
  }

  return updateTransaction(transaction, patch);
};
