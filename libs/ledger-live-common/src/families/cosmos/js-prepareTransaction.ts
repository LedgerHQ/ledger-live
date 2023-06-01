import { CacheRes, makeLRUCache } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getEnv } from "../../env";
import { CosmosAPI } from "./api/Cosmos";
import cryptoFactory from "./chain/chain";
import {
  buildUnsignedPayloadTransaction,
  postBuildUnsignedPayloadTransaction,
} from "./js-buildTransaction";
import { getMaxEstimatedBalance } from "./logic";
import { CosmosAccount, Transaction } from "./types";

export const calculateFees: CacheRes<
  Array<{
    account: Account;
    transaction: Transaction;
  }>,
  {
    estimatedFees: BigNumber;
    estimatedGas: BigNumber;
  }
> = makeLRUCache(
  async ({
    account,
    transaction,
  }): Promise<{
    estimatedFees: BigNumber;
    estimatedGas: BigNumber;
  }> => {
    return await getEstimatedFees(account as CosmosAccount, transaction);
  },
  ({ account, transaction }) =>
    `${account.id}_${account.currency.id}_${transaction.amount.toString()}_${
      transaction.recipient
    }_${String(transaction.useAllAmount)}_${transaction.mode}_${
      transaction.validators
        ? transaction.validators
            .map((v) => `${v.address}-${v.amount}`)
            .join("_")
        : ""
    }_${transaction.memo ? transaction.memo.toString() : ""}_${
      transaction.sourceValidator ? transaction.sourceValidator : ""
    }`,
  {
    ttl: 1000 * 60, // 60 sec
  }
);

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
    .times(cosmosCurrency.minGasPrice)
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

  const { estimatedFees, estimatedGas } = await calculateFees({
    account,
    transaction: {
      ...transaction,
      amount: transaction.useAllAmount
        ? account.spendableBalance.minus(new BigNumber(2500))
        : amount,
      memo,
    },
  });
  if (transaction.useAllAmount) {
    amount = getMaxEstimatedBalance(account as CosmosAccount, estimatedFees, transaction);
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
