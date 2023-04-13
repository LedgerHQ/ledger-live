import { BigNumber } from "bignumber.js";
import BN from "bn.js";
import flatMap from "lodash/flatMap";
import { Account, Address, Operation } from "@ledgerhq/types-live";
import {
  makeUnsignedSTXTokenTransfer,
  UnsignedTokenTransferOptions,
  createMessageSignature,
} from "@stacks/transactions";

import {
  GetAccountShape,
  AccountShapeInfo,
} from "../../../../bridge/jsHelpers";
import { decodeAccountId, encodeAccountId } from "../../../../account";
import {
  fetchBalances,
  fetchBlockHeight,
  fetchFullTxs,
} from "../../bridge/utils/api";
import { StacksNetwork, TransactionResponse } from "./types";
import { getCryptoCurrencyById } from "../../../../currencies";
import { encodeOperationId } from "../../../../operation";

export const getTxToBroadcast = async (
  operation: Operation,
  signature: string
): Promise<Buffer> => {
  const {
    value,
    recipients,
    fee,
    extra: { xpub, nonce, anchorMode, network, memo },
  } = operation;

  const options: UnsignedTokenTransferOptions = {
    amount: new BN(value.minus(fee).toFixed()),
    recipient: recipients[0],
    anchorMode,
    memo,
    network: StacksNetwork[network],
    publicKey: xpub,
    fee: new BN(fee.toFixed()),
    nonce: new BN(nonce.toFixed()),
  };

  const tx = await makeUnsignedSTXTokenTransfer(options);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore need to ignore the TS error here
  tx.auth.spendingCondition.signature = createMessageSignature(signature);

  return tx.serialize();
};

export const getUnit = () => getCryptoCurrencyById("stacks").units[0];

export const getAddress = (a: Account): Address =>
  a.freshAddresses.length > 0
    ? a.freshAddresses[0]
    : { address: a.freshAddress, derivationPath: a.freshAddressPath };

export const mapTxToOps =
  (accountID, { address }: AccountShapeInfo) =>
  (tx: TransactionResponse): Operation[] => {
    const { sender, recipient, amount } = tx.stx_transfers[0];
    const { tx_id, fee_rate, block_height, burn_block_time, token_transfer } =
      tx.tx;
    const { memo: memoHex } = token_transfer;

    const ops: Operation[] = [];

    const date = new Date(burn_block_time * 1000);
    const value = new BigNumber(amount || "0");
    const feeToUse = new BigNumber(fee_rate || "0");

    const isSending = address === sender;
    const isReceiving = address === recipient;

    const memo = Buffer.from(memoHex.substring(2), "hex")
      .toString()
      .replaceAll("\x00", "");

    if (isSending) {
      ops.push({
        id: encodeOperationId(accountID, tx_id, "OUT"),
        hash: tx_id,
        type: "OUT",
        value: value.plus(feeToUse),
        fee: feeToUse,
        blockHeight: block_height,
        blockHash: null,
        accountId: accountID,
        senders: [sender],
        recipients: [recipient],
        date,
        extra: {
          memo,
        },
      });
    }

    if (isReceiving) {
      ops.push({
        id: encodeOperationId(accountID, tx_id, "IN"),
        hash: tx_id,
        type: "IN",
        value,
        fee: feeToUse,
        blockHeight: block_height,
        blockHash: null,
        accountId: accountID,
        senders: [sender],
        recipients: [recipient],
        date,
        extra: {
          memo,
        },
      });
    }

    return ops;
  };

export const getAccountShape: GetAccountShape = async (info) => {
  const { initialAccount, address, currency, rest = {}, derivationMode } = info;

  const publicKey = reconciliatePublicKey(rest.publicKey, initialAccount);

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: publicKey,
    derivationMode,
  });

  const blockHeight = await fetchBlockHeight();
  const balance = await fetchBalances(address);
  const rawTxs = await fetchFullTxs(address);

  const result = {
    id: accountId,
    xpub: publicKey,
    freshAddress: address,
    balance: new BigNumber(balance.balance),
    spendableBalance: new BigNumber(balance.balance),
    operations: flatMap(rawTxs, mapTxToOps(accountId, info)),
    blockHeight: blockHeight.chain_tip.block_height,
  };

  return result;
};

function reconciliatePublicKey(
  publicKey: string | undefined,
  initialAccount: Account | undefined
): string {
  if (publicKey) return publicKey;
  if (initialAccount) {
    const { xpubOrAddress } = decodeAccountId(initialAccount.id);
    return xpubOrAddress;
  }
  throw new Error("publicKey wasn't properly restored");
}
