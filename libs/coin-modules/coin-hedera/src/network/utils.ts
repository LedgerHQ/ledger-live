import { AccountId } from "@hashgraph/sdk";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { SUPPORTED_ERC20_TOKENS } from "../constants";
import { nanosToSeconds, toEntityId } from "../logic/utils";
import type {
  HederaMirrorTokenTransfer,
  HederaMirrorCoinTransfer,
  HederaThirdwebTransaction,
  HederaThirdwebDecodedTransferParams,
  OperationERC20,
  HederaERC20TokenBalance,
  ERC20TokenTransfer,
  EnrichedERC20Transfer,
} from "../types";
import { apiClient } from "./api";
import { hgraphClient } from "./hgraph";

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
  stakingReward = new BigNumber(0),
): Pick<Operation, "type" | "value" | "senders" | "recipients"> {
  let value = new BigNumber(0);
  let type: OperationType = "NONE";

  const senders: string[] = [];
  const recipients: string[] = [];

  for (const transfer of mirrorTransfers) {
    const amount = new BigNumber(transfer.amount);
    const accountId = AccountId.fromString(transfer.account);

    // staking reward is included in transfer, so it can be positive even if user sent less HBARs than the reward is
    if (transfer.account === address) {
      const amountWithoutReward = amount.minus(stakingReward);
      value = amountWithoutReward.abs();
      type = amountWithoutReward.isNegative() ? "OUT" : "IN";
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

// TODO: remove once migration to new API is complete
export async function getERC20BalancesForAccount(
  evmAccountId: string,
  supportedTokenIds = SUPPORTED_ERC20_TOKENS.map(token => token.id),
): Promise<HederaERC20TokenBalance[]> {
  const availableTokens: TokenCurrency[] = [];

  for (const erc20TokenId of supportedTokenIds) {
    const calToken = await getCryptoAssetsStore().findTokenById(erc20TokenId);

    if (calToken) {
      availableTokens.push(calToken);
    }
  }

  const promises = availableTokens.map(async erc20token => {
    const balance = await apiClient.getERC20Balance(evmAccountId, erc20token.contractAddress);

    return {
      balance,
      token: erc20token,
    };
  });

  const balances = await Promise.all(promises);

  return balances;
}

export async function getERC20BalancesForAccountV2(
  address: string,
): Promise<HederaERC20TokenBalance[]> {
  const balances: HederaERC20TokenBalance[] = [];

  const rawBalances = await hgraphClient.getERC20Balances({ address });

  for (const rawBalance of rawBalances) {
    const rawBalanceTokenId = toEntityId({ num: rawBalance.token_id });

    const supportedToken = SUPPORTED_ERC20_TOKENS.find(token => {
      return token.tokenId === rawBalanceTokenId;
    });

    if (!supportedToken) {
      continue;
    }

    const calToken = await getCryptoAssetsStore().findTokenById(supportedToken.id);

    if (!calToken) {
      continue;
    }

    balances.push({
      token: calToken,
      balance: new BigNumber(rawBalance.balance),
    });
  }

  return balances;
}

// TODO: remove once migration to new API is complete
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

// TODO: remove once migration to new API is complete
export function parseThirdwebTransactionParams(
  transaction: HederaThirdwebTransaction,
): HederaThirdwebDecodedTransferParams | null {
  const { from, to, value } = transaction.decoded.params;

  if (typeof from !== "string" || typeof to !== "string" || typeof value !== "string") {
    return null;
  }

  return { from, to, value };
}

/**
 * Enriches raw ERC20 transfers from Hgraph with additional data needed for operations:
 * - fetches contract call result containing gas metrics and block hash
 * - finds the corresponding Mirror Node transaction by consensus timestamp
 *
 * @param erc20Transfers - Raw ERC20 transfers from Hgraph API
 * @returns Array of enriched transfers with complete operation data, filtered to supported tokens only
 */
export const enrichERC20Transfers = async (erc20Transfers: ERC20TokenTransfer[]) => {
  const enrichedTransfers: EnrichedERC20Transfer[] = [];

  for (const rawTransfer of erc20Transfers) {
    const payerAddress = toEntityId({ num: rawTransfer.payer_account_id });
    const hash = rawTransfer.transaction_hash;
    const inaccurateConsensusTimestampNs = new BigNumber(rawTransfer.consensus_timestamp);
    const inaccurateConsensusTimestamp = nanosToSeconds(inaccurateConsensusTimestampNs).toFixed(9);

    const [contractCallResult, mirrorTransaction] = await Promise.all([
      apiClient.getContractCallResult(hash),
      apiClient.findTransactionByContractCallV2({
        payerAddress,
        timestamp: inaccurateConsensusTimestamp,
      }),
    ]);

    if (!mirrorTransaction) {
      continue;
    }

    enrichedTransfers.push({
      transfer: rawTransfer,
      contractCallResult,
      mirrorTransaction,
    });
  }

  return enrichedTransfers;
};
