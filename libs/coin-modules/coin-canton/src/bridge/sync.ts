import BigNumber from "bignumber.js";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getBalance, getLedgerEnd, getOperations, type OperationInfo } from "../network/gateway";
import { CantonAccount } from "../types";
import coinConfig from "../config";
import { getPartyByPubKey } from "../network/gateway";
import resolver from "../signer";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CantonSigner } from "../types";

const txInfoToOperationAdapter =
  (accountId: string, partyId: string) =>
  (txInfo: OperationInfo): Operation => {
    const {
      transaction_hash,
      uid,
      block: { height, hash },
      senders,
      recipients,
      transaction_timestamp,
      fee: { value: fee },
      transfers: [{ value: transferValue, details }],
    } = txInfo;
    let type: OperationType = "UNKNOWN";
    if (txInfo.type === "Send") {
      type = senders.includes(partyId) ? "OUT" : "IN";
    } else if (txInfo.type === "Receive") {
      type = "IN";
    }
    const value = new BigNumber(transferValue);
    const feeValue = new BigNumber(fee);
    const memo = details.metadata.reason;

    const op: Operation = {
      id: encodeOperationId(accountId, transaction_hash, type),
      hash: transaction_hash,
      accountId,
      type,
      value,
      fee: feeValue,
      blockHash: hash,
      blockHeight: height,
      senders,
      recipients,
      date: new Date(transaction_timestamp),
      transactionSequenceNumber: height,
      extra: {
        uid,
        memo,
      },
    };

    return op;
  };

const filterOperations = (
  transactions: OperationInfo[],
  accountId: string,
  partyId: string,
): Operation[] => {
  return transactions.map(txInfoToOperationAdapter(accountId, partyId));
};

export function makeGetAccountShape(
  signerContext: SignerContext<CantonSigner>,
): GetAccountShape<CantonAccount> {
  return async info => {
    const { address, initialAccount, currency, derivationMode, derivationPath, rest } = info;

    console.log("info", info);

    let xpubOrAddress = (
      (initialAccount && initialAccount.id && decodeAccountId(initialAccount.id).xpubOrAddress) ||
      ""
    ).replace(/:/g, "_");
    let partyId =
      rest?.cantonResources?.partyId ||
      initialAccount?.cantonResources?.partyId ||
      xpubOrAddress.replace(/_/g, ":");

    if (!partyId) {
      const getAddress = resolver(signerContext);
      const { publicKey } = await getAddress(info.deviceId || "", {
        path: derivationPath,
        currency: currency,
        derivationMode: derivationMode,
        verify: false,
      });
      console.log("partyId", partyId);
      try {
        const { party_id } = await getPartyByPubKey(currency, publicKey);
        partyId = party_id;
        xpubOrAddress = partyId.replace(/:/g, "_");
        console.log("partyId", partyId);
      } catch (e) {
        console.log("partyId does not exist", e);
        // throw e; // Re-throw other errors
      }
    }

    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress,
      derivationMode,
    });

    // Account info retrieval + spendable balance calculation
    // const accountInfo = await getAccountInfo(address);
    const balances = partyId ? await getBalance(currency, partyId) : [];

    // TODO change to balance.instrument_id === "Amulet" after update on backend
    const balanceData = balances.find(balance => balance.instrument_id.includes("Amulet")) || {
      instrument_id: "Amulet",
      amount: 0,
      locked: false,
    };

    const balance = new BigNumber(balanceData.amount);
    const reserveMin = coinConfig.getCoinConfig().minReserve || 0;
    const lockedAmount = balanceData.locked ? balance : new BigNumber(0);
    const spendableBalance = BigNumber.max(
      0,
      balance.minus(lockedAmount).minus(BigNumber(reserveMin)),
    );

    let operations: Operation[] = [];
    // Tx history fetching if xpubOrAddress is not empty
    if (xpubOrAddress) {
      const oldOperations = initialAccount?.operations || [];
      const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;
      const transactionData = await getOperations(currency, partyId, {
        cursor: startAt,
        limit: 100,
      });

      const newOperations = filterOperations(transactionData.operations, accountId, partyId);
      operations = mergeOps(oldOperations, newOperations);
    }
    // blockheight retrieval
    const blockHeight = await getLedgerEnd(currency);
    // We return the new account shape
    const shape = {
      id: accountId,
      xpub: xpubOrAddress,
      blockHeight,
      balance,
      spendableBalance,
      operations,
      operationsCount: operations.length,
      freshAddress: address,
      freshAddressPath: derivationPath,
      used: balance.gt(0),
      cantonResources: {
        partyId,
      },
    };

    console.log("shape", shape);

    return shape;
  };
}
