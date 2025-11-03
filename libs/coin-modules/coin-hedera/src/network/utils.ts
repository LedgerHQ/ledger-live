import BigNumber from "bignumber.js";
import { AccountId } from "@hashgraph/sdk";
import { getCryptoCurrencyById, listTokensForCryptoCurrency } from "@ledgerhq/cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { apiClient } from "./api";
import type {
  HederaMirrorTokenTransfer,
  HederaMirrorCoinTransfer,
  HederaThirdwebTransaction,
  HederaThirdwebDecodedTransferParams,
  OperationERC20,
  HederaERC20TokenBalance,
} from "../types";

function isValidRecipient(accountId: AccountId, recipients: string[]): boolean {
  if (accountId.shard.eq(0) && accountId.realm.eq(0)) {
    // account is a node, only add to list if we have none
    if (accountId.num.lt(100)) {
      return recipients.length === 0;
    }

    // account is a system account that is not a node, do NOT add
    if (accountId.num.lt(1000)) {
      return false;
    }
  }

  return true;
}

export function parseTransfers(
  mirrorTransfers: (HederaMirrorCoinTransfer | HederaMirrorTokenTransfer)[],
  address: string,
): Pick<Operation, "type" | "value" | "senders" | "recipients"> {
  let value = new BigNumber(0);
  let type: OperationType = "NONE";

  const senders: string[] = [];
  const recipients: string[] = [];

  for (const transfer of mirrorTransfers) {
    const amount = new BigNumber(transfer.amount);
    const accountId = AccountId.fromString(transfer.account);

    if (transfer.account === address) {
      value = amount.abs();
      type = amount.isNegative() ? "OUT" : "IN";
    }

    if (amount.isNegative()) {
      senders.push(transfer.account);
    } else if (isValidRecipient(accountId, recipients)) {
      recipients.push(transfer.account);
    }
  }

  // NOTE: earlier addresses are the "fee" addresses
  senders.reverse();
  recipients.reverse();

  return {
    type,
    value,
    senders,
    recipients,
  };
}

export async function getERC20BalancesForAccount(
  evmAccountId: string,
): Promise<HederaERC20TokenBalance[]> {
  const currency = getCryptoCurrencyById("hedera");
  const availableTokens = listTokensForCryptoCurrency(currency);
  const availableERC20Tokens = availableTokens.filter(t => t.tokenType === "erc20");

  const promises = availableERC20Tokens.map(async erc20token => {
    const balance = await apiClient.getERC20Balance(evmAccountId, erc20token.contractAddress);

    return {
      balance,
      token: erc20token,
    };
  });

  const balances = await Promise.all(promises);

  return balances;
}

export const getERC20Operations = async (
  latestERC20Transactions: HederaThirdwebTransaction[],
): Promise<OperationERC20[]> => {
  const latestERC20Operations: OperationERC20[] = [];

  for (const thirdwebTransaction of latestERC20Transactions) {
    const tokenId = thirdwebTransaction.address;
    const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(tokenId, "hedera");

    if (!token) continue;

    const hash = thirdwebTransaction.transactionHash;
    const contractCallResult = await apiClient.getContractCallResult(hash);
    const mirrorTransaction = await apiClient.findTransactionByContractCall(
      contractCallResult.timestamp,
      contractCallResult.contract_id,
    );

    if (!mirrorTransaction) continue;

    latestERC20Operations.push({
      thirdwebTransaction,
      mirrorTransaction,
      contractCallResult,
      token,
    });
  }

  return latestERC20Operations;
};

export function parseThirdwebTransactionParams(
  transaction: HederaThirdwebTransaction,
): HederaThirdwebDecodedTransferParams | null {
  const { from, to, value } = transaction.decoded.params;

  if (typeof from !== "string" || typeof to !== "string" || typeof value !== "string") {
    return null;
  }

  return { from, to, value };
}
