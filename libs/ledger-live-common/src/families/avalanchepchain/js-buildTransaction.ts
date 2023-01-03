import type { Transaction } from "./types";
import { BN } from "avalanche";
import { avalancheClient } from "./api/client";
import { HDHelper } from "./hdhelper";
import type { Account } from "@ledgerhq/types-live";
import { UnsignedTx } from "avalanche/dist/apis/platformvm";

const buildTransaction = async (
  account: Account,
  transaction: Transaction,
  hdHelper: HDHelper
): Promise<UnsignedTx> => {
  const { amount } = transaction;

  const utxos = await hdHelper.fetchUTXOs();
  const returnAddress = hdHelper.getCurrentAddress();
  const pAddresses = hdHelper.getAllDerivedAddresses();
  const changeAddress = hdHelper.getFirstAvailableAddress();
  const nodeId = transaction.recipient;
  const startTime: BN = new BN(transaction.startTime?.toString());
  const endTime: BN = new BN(transaction.endTime?.toString());
  const stakeAmount: BN = transaction.useAllAmount
    ? new BN(account.spendableBalance.minus(transaction.fees || 0).toString())
    : new BN(amount.toString());

  const pChain = avalancheClient().PChain();

  const unsignedTx = await pChain.buildAddDelegatorTx(
    utxos,
    [returnAddress],
    pAddresses,
    [changeAddress],
    nodeId,
    startTime,
    endTime,
    stakeAmount,
    [returnAddress]
  );

  return unsignedTx;
};

export default buildTransaction;
