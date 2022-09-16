import { BigNumber } from "bignumber.js";
import flatMap from "lodash/flatMap";
import { Account, Address, Operation } from "@ledgerhq/types-live";
import {
  makeUnsignedSTXTokenTransfer,
  UnsignedTokenTransferOptions,
  createMessageSignature,
} from "@stacks/transactions/dist";

import {
  GetAccountShape,
  GetAccountShapeArg0,
} from "../../../../bridge/jsHelpers";
import { encodeAccountId } from "../../../../account";
import {
  fetchBalances,
  fetchBlockHeight,
  fetchTxs,
} from "../../bridge/utils/api";
import { TransactionResponse } from "./types";
import { getCryptoCurrencyById } from "../../../../currencies";

export const getTxToBroadcast = async (
  operation: Operation,
  signature: string
): Promise<Buffer> => {
  const {
    value,
    recipients,
    fee,
    extra: { xpub, nonce, anchorMode, network },
  } = operation;

  const options: UnsignedTokenTransferOptions = {
    amount: value.minus(fee).toFixed(),
    recipient: recipients[0],
    anchorMode,
    network,
    publicKey: xpub,
    fee: fee.toFixed(),
    nonce: nonce.toFixed(),
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
  (id, { address }: GetAccountShapeArg0) =>
  (tx: TransactionResponse): Operation[] => {
    const { sender, recipient, amount } = tx.stx_transfers[0];
    const { tx_id, fee_rate, block_height, burn_block_time } = tx.tx;

    const ops: Operation[] = [];

    const date = new Date(burn_block_time * 1000);
    const value = new BigNumber(amount || "0");
    const feeToUse = new BigNumber(fee_rate || "0");

    const isSending = address === sender;
    const isReceiving = address === recipient;

    if (isSending) {
      ops.push({
        id: `${id}-${tx_id}-OUT`,
        hash: tx_id,
        type: "OUT",
        value: value.plus(feeToUse),
        fee: feeToUse,
        blockHeight: block_height,
        blockHash: null,
        accountId: id,
        senders: [sender],
        recipients: [recipient],
        date,
        extra: {},
      });
    }

    if (isReceiving) {
      ops.push({
        id: `${id}-${tx_id}-IN`,
        hash: tx_id,
        type: "IN",
        value,
        fee: feeToUse,
        blockHeight: block_height,
        blockHash: null,
        accountId: id,
        senders: [sender],
        recipients: [recipient],
        date,
        extra: {},
      });
    }

    return ops;
  };

export const getAccountShape: GetAccountShape = async (info) => {
  const { address, currency, rest = {}, derivationMode } = info;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const blockHeight = await fetchBlockHeight();
  const balance = await fetchBalances(address);
  const rawTxs = await fetchTxs(address);

  const result = {
    id: accountId,
    xpub: rest["publicKey"], // This field come from hw-getAddress result...
    balance: new BigNumber(balance.balance),
    spendableBalance: new BigNumber(balance.balance),
    operations: flatMap(rawTxs, mapTxToOps(accountId, info)),
    blockHeight: blockHeight.chain_tip.block_height,
  };

  return result;
};
