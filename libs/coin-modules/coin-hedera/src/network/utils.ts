import BigNumber from "bignumber.js";
import { AccountId } from "@hashgraph/sdk";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { apiClient } from "./api";
import { SUPPORTED_ERC20_TOKENS } from "../constants";
import { hgraphClient } from "./hgraph";
import { toEntityId } from "../logic/utils";
import type {
  HederaMirrorTokenTransfer,
  HederaMirrorCoinTransfer,
  HederaERC20TokenBalance,
  EnrichedERC20Transfer,
  ERC20TokenTransfer,
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

export async function getERC20BalancesForAccount(
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

/**
 * Enriches raw ERC20 transfers from Hgraph with additional data needed for operations:
 * - fetches contract call result containing gas metrics and block hash
 * - finds the corresponding Mirror Node transaction by consensus timestamp
 * - filters to only supported ERC20 tokens registered in CAL
 *
 * @param erc20Transfers - Raw ERC20 transfers from Hgraph API
 * @returns Array of enriched transfers with complete operation data, filtered to supported tokens only
 */
export const enrichERC20Transfers = async (erc20Transfers: ERC20TokenTransfer[]) => {
  const enrichedTransfers: EnrichedERC20Transfer[] = [];

  for (const rawTransfer of erc20Transfers) {
    const payerAddress = toEntityId({ num: rawTransfer.payer_account_id });
    const hash = rawTransfer.transaction_hash;
    const inaccurateConsensusTimestamp = new BigNumber(rawTransfer.consensus_timestamp)
      .dividedBy(10 ** 9)
      .toFixed(9);

    const [contractCallResult, mirrorTransaction] = await Promise.all([
      apiClient.getContractCallResult(hash),
      apiClient.findTransactionByContractCall({
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
