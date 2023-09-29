import BigNumber from "bignumber.js";
import type { Types as AptosTypes } from "aptos";
import type { AccountBridge, CurrencyBridge, Operation, OperationType } from "@ledgerhq/types-live";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import type { AptosTransaction, Transaction } from "./types";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";

import { encodeAccountId } from "../../account";
import { encodeOperationId } from "../../operation";

import { AptosAPI } from "./api";
import Aptos from "./hw-app-aptos";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AddressData } from "./hw-app-aptos/src/Aptos";

const getBlankOperation = (tx: AptosTransaction, id: string): Operation => ({
  id: "",
  hash: tx.hash,
  type: "" as OperationType,
  value: new BigNumber(0),
  fee: new BigNumber(0),
  blockHash: tx.block.hash,
  blockHeight: tx.block.height,
  senders: [] as string[],
  recipients: [] as string[],
  accountId: id,
  date: new Date(parseInt(tx.timestamp) / 1000),
  extra: {},
  transactionSequenceNumber: parseInt(tx.sequence_number),
  hasFailed: false,
});

const txsToOps = (info: any, id: string, txs: AptosTransaction[]) => {
  const { address } = info;
  const ops: Operation[] = [];
  txs.forEach(tx => {
    const op: Operation = getBlankOperation(tx, id);
    op.fee = new BigNumber(tx.gas_used).multipliedBy(BigNumber(tx.gas_unit_price));

    const entryFunctionPayload = tx.payload as AptosTypes.EntryFunctionPayload;
    const functionName = entryFunctionPayload.function.slice(
      entryFunctionPayload.function.lastIndexOf("::") + 2,
    );
    (op.extra as any).entryFunction = entryFunctionPayload.function.slice(
      entryFunctionPayload.function.indexOf("::") + 2,
    );

    switch (functionName) {
      case "transfer": {
        op.type = "OUT";
        op.recipients.push(entryFunctionPayload.arguments[0]);
        op.value = op.value.plus(entryFunctionPayload.arguments[1]);
        op.value = op.value.plus(op.fee);
        break;
      }
      case "add_liquidity": {
        op.type = "ADD_LIQUIDITY";
        op.value = op.value.plus(entryFunctionPayload.arguments[0]);
        break;
      }
      case "create_account": {
        op.type = "CREATE_ACCOUNT";
        op.value = op.value.plus(op.fee);
        break;
      }
      default: {
        op.type = "CUSTOM_CALL";
        op.value = op.value.plus(op.fee);
        break;
      }
    }

    op.senders.push(address);
    op.hasFailed = !tx.success;
    op.id = encodeOperationId(id, tx.hash, op.type);
    ops.push(op);
  });
  return ops;
};

export type SignerContext = (
  deviceId: string,
  crypto: CryptoCurrency,
  fn: (signer: Aptos) => Promise<AddressData>,
) => Promise<AddressData>;

const makeGetAccountShape =
  (signerContext: SignerContext): GetAccountShape =>
  async info => {
    const { address, initialAccount, derivationMode, derivationPath, currency, deviceId } = info;

    const oldOperations = initialAccount?.operations || [];

    let xpub = initialAccount?.xpub;

    if (!xpub) {
      if (deviceId === null || deviceId === undefined) {
        throw new Error("DeviceId required to generate the xpub");
      }
      const r = await signerContext(deviceId, currency, signer =>
        signer.getAddress(derivationPath),
      );
      xpub = r?.publicKey.toString("hex");
    }

    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: address,
      derivationMode,
    });

    const aptosClient = new AptosAPI(currency.id);

    const { balance, txs, blockHeight } = await aptosClient.getAccountInfo(address);

    const newOperations = txsToOps(info, accountId, txs);
    const operations = mergeOps(oldOperations, newOperations);

    const shape = {
      id: accountId,
      xpub,
      balance: balance,
      spendableBalance: balance,
      operationsCount: operations.length,
      blockHeight,
    };

    return { ...shape, operations };
  };

export const scanAccounts = (signerContext: SignerContext): CurrencyBridge["scanAccounts"] =>
  makeScanAccounts({
    getAccountShape: makeGetAccountShape(signerContext),
  });
export const sync = (signerContext: SignerContext): AccountBridge<Transaction>["sync"] =>
  makeSync({ getAccountShape: makeGetAccountShape(signerContext) });
