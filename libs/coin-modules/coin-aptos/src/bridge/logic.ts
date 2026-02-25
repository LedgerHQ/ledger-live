import { EntryFunctionPayloadResponse } from "@aptos-labs/ts-sdk";
import {
  encodeTokenAccountId,
  findSubAccountById,
  isTokenAccount,
} from "@ledgerhq/coin-framework/account/index";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type {
  Account,
  AccountLike,
  Operation,
  OperationType,
  TokenAccount,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  APTOS_ASSET_ID,
  OP_TYPE,
  DEFAULT_GAS,
  DEFAULT_GAS_PRICE,
  APTOS_ASSET_FUNGIBLE_ID,
} from "../constants";
import { calculateAmount } from "../logic/calculateAmount";
import { compareAddress, getCoinAndAmounts } from "../logic/getCoinAndAmounts";
import { getFunctionAddress } from "../logic/getFunctionAddress";
import { processRecipients } from "../logic/processRecipients";
import { convertFunctionPayloadResponseToInputEntryFunctionData } from "../logic/transactionsToOperations";
import type { AptosAccount, AptosTransaction, Transaction } from "../types";

export const getMaxSendBalance = (
  account: AccountLike<AptosAccount>,
  parentAccount?: AptosAccount,
  gas?: BigNumber,
  gasPrice?: BigNumber,
): BigNumber => {
  gas = gas ?? BigNumber(DEFAULT_GAS);
  gasPrice = gasPrice ?? BigNumber(DEFAULT_GAS_PRICE);

  const totalGas = gas.multipliedBy(gasPrice);

  return parentAccount
    ? account.spendableBalance
    : getMaxSendBalanceFromAccount(account as Account, totalGas);
};

const getMaxSendBalanceFromAccount = (account: Account, totalGas: BigNumber) =>
  account.spendableBalance.gt(totalGas)
    ? account.spendableBalance.minus(totalGas)
    : new BigNumber(0);

export const getBlankOperation = (
  tx: AptosTransaction,
  id: string,
): Operation<Record<string, string>> => ({
  id: "",
  hash: tx.hash,
  type: "" as OperationType,
  value: new BigNumber(0),
  fee: new BigNumber(0),
  blockHash: tx.block?.hash,
  blockHeight: tx.block?.height,
  senders: [] as string[],
  recipients: [] as string[],
  accountId: id,
  date: new Date(parseInt(tx.timestamp) / 1000),
  extra: { version: tx.version },
  transactionSequenceNumber: new BigNumber(parseInt(tx.sequence_number)),
  hasFailed: false,
});

export const txsToOps = async (
  info: { address: string },
  id: string,
  txs: (AptosTransaction | null)[],
): Promise<[Operation[], Operation[], Operation[]]> => {
  const { address } = info;
  const ops: Operation[] = [];
  const opsTokens: Operation[] = [];
  const opsStaking: Operation[] = [];

  for (const tx of txs) {
    if (tx !== null) {
      const op: Operation = getBlankOperation(tx, id);
      op.fee = new BigNumber(tx.gas_used).multipliedBy(new BigNumber(tx.gas_unit_price));

      const payload = convertFunctionPayloadResponseToInputEntryFunctionData(
        tx.payload as EntryFunctionPayloadResponse,
      );

      const function_address = getFunctionAddress(payload);

      if (!function_address) {
        continue; // skip transaction without functions in payload
      }

      const { coin_id, amount_in, amount_out, type } = getCoinAndAmounts(tx, address);
      op.value = calculateAmount(tx.sender, address, amount_in, amount_out);
      op.type =
        type !== OP_TYPE.UNKNOWN
          ? type
          : compareAddress(tx.sender, address)
            ? OP_TYPE.OUT
            : OP_TYPE.IN;
      op.senders.push(tx.sender);
      op.hasFailed = !tx.success;
      op.id = encodeOperationId(op.accountId, tx.hash, op.type);

      processRecipients(payload, address, op, function_address);

      if (op.value.isZero()) {
        // skip transaction that result no Aptos change
        op.type = OP_TYPE.UNKNOWN;
      }

      if (
        op.type === OP_TYPE.STAKE ||
        op.type === OP_TYPE.UNSTAKE ||
        op.type === OP_TYPE.WITHDRAW
      ) {
        ops.push(op);
        opsStaking.push(op);
      } else if (op.type !== OP_TYPE.UNKNOWN && coin_id !== null) {
        if (coin_id === APTOS_ASSET_ID || coin_id === APTOS_ASSET_FUNGIBLE_ID) {
          ops.push(op);
        } else {
          const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
            coin_id.toLowerCase(),
            "aptos",
          );
          if (token !== undefined) {
            const tokenAccountId = encodeTokenAccountId(id, token);
            op.accountId = tokenAccountId;
            opsTokens.push(op);

            if (op.type === OP_TYPE.OUT) {
              const accountId = tokenAccountId.split("+")[0];
              // Create FEES operation with decoded main account ID
              const feesOp = {
                ...op,
                accountId,
                value: op.fee,
                type: "FEES" as const,
              };
              ops.push(feesOp);
            }
          }
        }
      }
    }
  }

  return [ops, opsTokens, opsStaking];
};

export function getTokenAccount(
  account: Account,
  transaction: Transaction,
): TokenAccount | undefined {
  const tokenAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  const fromTokenAccount = tokenAccount && isTokenAccount(tokenAccount);
  return fromTokenAccount ? tokenAccount : undefined;
}
