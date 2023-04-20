import { CosmosAccount, Transaction } from "./types";
import BigNumber from "bignumber.js";
import { getMaxEstimatedBalance } from "./logic";
import type { Account } from "@ledgerhq/types-live";
import cryptoFactory from "./chain/chain";
import { CosmosAPI } from "./api/Cosmos";
import {
  buildUnsignedPayloadTransaction,
  postBuildUnsignedPayloadTransaction,
} from "./js-buildTransaction";
import { getEnv } from "../../env";
import { log } from "@ledgerhq/logs";

export const getEstimatedFees = async (
  account: CosmosAccount,
  transaction: Transaction
): Promise<{ estimatedFees: BigNumber; estimatedGas: BigNumber }> => {
  const cosmosCurrency = cryptoFactory(account.currency.id);
  let estimatedGas = new BigNumber(cosmosCurrency.defaultGas);

  const cosmosAPI = new CosmosAPI(account.currency.id);
  const unsignedPayload: { typeUrl: string; value: any }[] =
    await buildUnsignedPayloadTransaction(account, transaction);

  if (unsignedPayload && unsignedPayload.length > 0) {
    const signature = new Uint8Array(
      Buffer.from(account.seedIdentifier, "hex")
    );

    // see https://github.com/cosmos/cosmjs/blob/main/packages/proto-signing/src/pubkey.spec.ts
    const prefix = new Uint8Array([10, 33]);

    const pubkey = {
      typeUrl: "/cosmos.crypto.secp256k1.PubKey",
      value: new Uint8Array([...prefix, ...signature]),
    };

    const tx_bytes = await postBuildUnsignedPayloadTransaction(
      account,
      transaction,
      pubkey,
      unsignedPayload,
      signature
    );
    try {
      const gasUsed = await cosmosAPI.simulate(tx_bytes);
      estimatedGas = gasUsed
        .multipliedBy(new BigNumber(getEnv("COSMOS_GAS_AMPLIFIER")))
        .integerValue(BigNumber.ROUND_CEIL);
    } catch (e) {
      log(
        "cosmos/simulate",
        "failed to estimate gas usage during tx simulation",
        {
          e,
        }
      );
    }
  }

  const estimatedFees = estimatedGas
    .times(cosmosCurrency.minGasprice)
    .integerValue(BigNumber.ROUND_CEIL);

  return { estimatedFees, estimatedGas };
};

export const prepareTransaction = async (
  account: Account,
  transaction: Transaction
): Promise<Transaction> => {
  let memo = transaction.memo;
  let amount = transaction.amount;

  if (transaction.mode !== "send" && !transaction.memo) {
    memo = "Ledger Live";
  }

  const { estimatedFees, estimatedGas } = await getEstimatedFees(
    account as CosmosAccount,
    {
      ...transaction,
      amount: transaction.useAllAmount
        ? account.spendableBalance.minus(new BigNumber(2500))
        : amount,
      memo,
    }
  );

  if (transaction.useAllAmount) {
    amount = getMaxEstimatedBalance(account as CosmosAccount, estimatedFees);
  }

  if (
    transaction.memo !== memo ||
    !estimatedFees.eq(transaction.fees || new BigNumber(0)) ||
    !estimatedGas.eq(transaction.gas || new BigNumber(0)) ||
    !amount.eq(transaction.amount)
  ) {
    return {
      ...transaction,
      memo,
      fees: estimatedFees,
      gas: estimatedGas,
      amount,
    };
  }

  return transaction;
};

export default prepareTransaction;
