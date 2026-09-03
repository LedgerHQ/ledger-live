import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import type { OperationType } from "@ledgerhq/types-live";
import {
  parseTransactionFields,
  resolveStakingOperationType,
  resolveTransactionAmount,
  toBlockDate,
} from "../logic/utils";
import type { AleoOperation, AleoPublicTransaction, EnrichedPrivateRecord } from "../types";

export const toBridgeOperation = (
  ledgerAccountId: string,
  rawTx: AleoPublicTransaction,
  address: string,
  isTokenTx?: boolean,
  bondArguments?: { validator: string; amount: BigNumber },
): AleoOperation => {
  const value = resolveTransactionAmount(rawTx);
  const { type, fee, blockHash, transactionType, date, hasFailed } = parseTransactionFields(
    rawTx,
    address,
  );
  const stakingType = resolveStakingOperationType(rawTx);

  if (value.isNaN() || value.isNegative()) {
    log("aleo/toBridgeOperation", `Invalid raw transaction details for ${address}`, rawTx);
  }

  if (value.isZero() && rawTx.function_id.includes("transfer")) {
    log("aleo/toBridgeOperation", `Zero value transaction for ${address}`, rawTx);
  }

  return {
    id: encodeOperationId(ledgerAccountId, rawTx.transaction_id, type),
    // The indexer blanks both sides of every staking call. There is no counterparty to show
    // anyway — staking moves funds between the account's own balances — so both are left empty,
    // matching every other staking family; `[""]` would render a blank From row in the drawer.
    recipients: stakingType ? [] : [rawTx.recipient_address],
    senders: stakingType ? [] : [rawTx.sender_address],
    value,
    type,
    hasFailed,
    hash: rawTx.transaction_id,
    fee: new BigNumber(fee),
    blockHeight: rawTx.block_number,
    blockHash,
    accountId: ledgerAccountId,
    date,
    extra: {
      functionId: rawTx.function_id,
      transactionType,
      ...(isTokenTx && { programId: rawTx.program_id }),
      ...(bondArguments && {
        validator: bondArguments.validator,
        stakedAmount: bondArguments.amount,
      }),
      // unbond_public is the one staking call whose amount the indexer does publish.
      ...(stakingType === "UNBOND" && { stakedAmount: value }),
    },
  };
};

export const toPrivateBridgeOperation = (
  ledgerAccountId: string,
  enrichedRecord: EnrichedPrivateRecord,
  address: string,
): AleoOperation => {
  const transactionId = enrichedRecord.rawRecord.transaction_id.trim();
  const blockHeight = enrichedRecord.rawRecord.block_height;
  const timestamp = toBlockDate(enrichedRecord.rawRecord.block_timestamp);
  const type: OperationType = enrichedRecord.recipient === address ? "IN" : "OUT";

  return {
    id: encodeOperationId(ledgerAccountId, transactionId, type),
    senders: [enrichedRecord.sender],
    recipients: [enrichedRecord.recipient],
    value: enrichedRecord.value,
    type,
    hasFailed: false,
    hash: transactionId,
    fee: new BigNumber(enrichedRecord.details.fee_value),
    blockHeight,
    blockHash: enrichedRecord.details.block_hash,
    accountId: ledgerAccountId,
    date: timestamp,
    extra: {
      functionId: enrichedRecord.rawRecord.function_name,
      transactionType: "private",
    },
  };
};

/** CAL lookup by Aleo program name (contract address). Missing programs are omitted. */
export async function getCalTokens({
  currencyId,
  programNames,
}: {
  currencyId: string;
  programNames: string[];
}): Promise<Map<string, TokenCurrency>> {
  const calTokens = new Map<string, TokenCurrency>();
  const uniqueProgramNames = [...new Set(programNames)];

  await promiseAllBatched(4, uniqueProgramNames, async programName => {
    const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      programName,
      currencyId,
    );

    if (token) {
      calTokens.set(programName, token);
    }
  });

  return calTokens;
}
