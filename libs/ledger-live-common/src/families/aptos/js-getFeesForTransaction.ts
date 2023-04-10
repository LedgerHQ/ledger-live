import BigNumber from "bignumber.js";
import { HexString, TxnBuilderTypes } from "aptos";
import { log } from "@ledgerhq/logs";
import type { Account } from "@ledgerhq/types-live";

import { AptosAPI } from "./api";
import buildTransaction from "./js-buildTransaction";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from "./logic";
import type { Transaction } from "./types";

export const getEstimatedGas = async (
  account: Account,
  transaction: Transaction,
  aptosClient: AptosAPI
) => {
  const res = {
    fees: new BigNumber(0),
    gasLimit: DEFAULT_GAS.toString(),
    gasUnitPrice: DEFAULT_GAS_PRICE.toString(),
  };

  try {
    if (!account.xpub)
      throw Error("Account public key missing to estimate transaction");

    const tx = await buildTransaction(account, transaction, aptosClient);

    const pubKeyUint = new HexString(account.xpub as string).toUint8Array();
    const publicKeyEd = new TxnBuilderTypes.Ed25519PublicKey(pubKeyUint);
    const simulation = await aptosClient.simulateTransaction(publicKeyEd, tx);
    const completedTx = simulation[0];

    if (!completedTx.success)
      throw Error(
        `Can not simulate aptos transaction: ${completedTx.vm_status}`
      );

    res.fees = res.fees.plus(
      BigNumber(
        Math.max(
          Math.ceil(+completedTx.gas_used * +completedTx.gas_unit_price),
          DEFAULT_GAS
        )
      )
    );
    res.gasLimit = completedTx.gas_used;
    res.gasUnitPrice = completedTx.gas_unit_price;
  } catch (e: any) {
    log("error", e.message);
    res.fees = res.fees.plus(DEFAULT_GAS);
  }

  return res;
};
