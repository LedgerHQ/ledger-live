import BigNumber from "bignumber.js";
import { EntryFunctionPayloadResponse } from "@aptos-labs/ts-sdk";
import type { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import {
  decodeTokenAccountId,
  encodeTokenAccountId,
  findSubAccountById,
  isTokenAccount,
} from "@ledgerhq/coin-framework/account/index";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets";
import { APTOS_ASSET_ID, OP_TYPE, DEFAULT_GAS, DEFAULT_GAS_PRICE } from "../constants";
import type { AptosTransaction, Transaction } from "../types";
import { convertFunctionPayloadResponseToInputEntryFunctionData } from "../logic/transactionsToOperations";
import { compareAddress, getCoinAndAmounts } from "../logic/getCoinAndAmounts";
import { calculateAmount } from "../logic/calculateAmount";
import { processRecipients } from "../logic/processRecipients";
import { getFunctionAddress } from "../logic/getFunctionAddress";

export const getMaxSendBalance = (
  account: Account,
  transaction?: Transaction,
  gas?: BigNumber,
  gasPrice?: BigNumber,
): BigNumber => {
  const tokenAccount = findSubAccountById(account, transaction?.subAccountId ?? "");
  const fromTokenAccount = tokenAccount && isTokenAccount(tokenAccount);

  gas = gas ?? BigNumber(DEFAULT_GAS);
  gasPrice = gasPrice ?? BigNumber(DEFAULT_GAS_PRICE);

  const totalGas = gas.multipliedBy(gasPrice);

  return fromTokenAccount
    ? tokenAccount.spendableBalance
    : account.spendableBalance.gt(totalGas)
      ? account.spendableBalance.minus(totalGas)
      : new BigNumber(0);
};

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
  transactionSequenceNumber: parseInt(tx.sequence_number),
  hasFailed: false,
});

export const txsToOps = (
  info: { address: string },
  id: string,
  txs: (AptosTransaction | null)[],
): [Operation[], Operation[], Operation[]] => {
  const { address } = info;
  const ops: Operation[] = [];
  const opsTokens: Operation[] = [];
  const opsStaking: Operation[] = [];

  txs.forEach(tx => {
    if (tx !== null) {
      const op: Operation = getBlankOperation(tx, id);
      op.fee = new BigNumber(tx.gas_used).multipliedBy(new BigNumber(tx.gas_unit_price));

      const payload = convertFunctionPayloadResponseToInputEntryFunctionData(
        tx.payload as EntryFunctionPayloadResponse,
      );

      const function_address = getFunctionAddress(payload);

      if (!function_address) {
        return; // skip transaction without functions in payload
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
        if (coin_id === APTOS_ASSET_ID) {
          ops.push(op);
        } else {
          const token = findTokenByAddressInCurrency(coin_id.toLowerCase(), "aptos");
          if (token !== undefined) {
            op.accountId = encodeTokenAccountId(id, token);
            opsTokens.push(op);

            if (op.type === OP_TYPE.OUT) {
              ops.push({
                ...op,
                accountId: decodeTokenAccountId(op.accountId).accountId,
                value: op.fee,
                type: "FEES",
              });
            }
          }
        }
      }
    }
  });

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
