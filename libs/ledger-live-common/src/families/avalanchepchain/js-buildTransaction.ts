import type { Transaction } from "./types";
import { BN } from "avalanche";
import { avalancheClient } from "./api/client";
import { HDHelper } from "./hdhelper";
import type { Account } from "../../types";

const buildTransaction = async (
  account: Account,
  transaction: Transaction,
  hdHelper: HDHelper
) => {
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

  //for testing
  //   const info = avalancheClient().Info();
  //   const nodeId = await info.getNodeID();
  //  const startTime: BN = UnixNow().add(new BN(FIVE_MINUTES));
  //   const endTime: BN = startTime.add(new BN(1814400)); //TODO: get this from UI
  //   console.log("UTXOs:", utxos);
  //   console.log("ADDRESSES: ", utxos.getAllUTXOStrings());

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