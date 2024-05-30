import { CacheRes, makeLRUCache } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import { CosmosAPI } from "./api/Cosmos";
import cryptoFactory from "./chain/chain";
import { txToMessages, buildTransaction } from "./buildTransaction";
import { getMaxEstimatedBalance } from "./logic";
import { CosmosAccount, Transaction } from "./types";

export const calculateFees: CacheRes<
  Array<{
    account: Account;
    transaction: Transaction;
  }>,
  {
    gasWanted: BigNumber;
    gasWantedFees: BigNumber;
  }
> = makeLRUCache(
  async ({
    account,
    transaction,
  }): Promise<{
    gasWanted: BigNumber;
    gasWantedFees: BigNumber;
  }> => {
    return await getEstimatedFees(account as CosmosAccount, transaction);
  },
  ({ account, transaction }) =>
    `${account.id}_${account.currency.id}_${transaction.amount.toFixed()}_${
      transaction.recipient
    }_${String(transaction.useAllAmount)}_${transaction.mode}_${
      transaction.validators
        ? transaction.validators.map(v => `${v.address}-${v.amount}`).join("_")
        : ""
    }_${transaction.memo ? transaction.memo.toString() : ""}_${
      transaction.sourceValidator ? transaction.sourceValidator : ""
    }`,
  {
    ttl: 1000 * 10, // 10 sec
  },
);

export const getEstimatedFees = async (
  account: CosmosAccount,
  transaction: Transaction,
): Promise<{
  gasWanted: BigNumber;
  gasWantedFees: BigNumber;
}> => {
  const chainInstance = cryptoFactory(account.currency.id);
  let gasUsed = new BigNumber(chainInstance.defaultGas);

  const cosmosAPI = new CosmosAPI(account.currency.id);
  const { protoMsgs } = txToMessages(account, transaction);
  const { sequence, pubKey, pubKeyType } = await cosmosAPI.getAccount(account.freshAddress);

  const unsignedTx = buildTransaction({
    protoMsgs,
    gasLimit: undefined,
    feeAmount: [
      {
        denom: account.currency.units[1].code,
        amount: "1", // Amount should just not be 0 as it would impact the simulation by requiring less gas
      },
    ],
    memo: transaction.memo || "",
    pubKey,
    pubKeyType,
    sequence,
    // Signature isn't verified during simulation, but size matters (:wink::wink:)
    // and content not being 0 as well as it would require less gas
    signature: Uint8Array.from(Buffer.alloc(65).fill(1)),
  });

  try {
    gasUsed = await cosmosAPI.simulate(Array.from(unsignedTx));
  } catch (e) {
    log("debug", "failed to estimate gas usage during tx simulation", {
      e,
    });
  }

  const gasWanted = gasUsed
    .times(getEnv("COSMOS_GAS_AMPLIFIER"))
    .integerValue(BigNumber.ROUND_CEIL);

  const gasWantedFees = gasWanted
    .times(chainInstance.minGasPrice)
    .integerValue(BigNumber.ROUND_CEIL);

  return { gasWanted, gasWantedFees };
};

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  let { memo, amount } = transaction;

  if (transaction.mode !== "send" && !transaction.memo) {
    memo = "Ledger Live";
  }

  const { gasWanted, gasWantedFees } = await calculateFees({
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
    amount = getMaxEstimatedBalance(account as CosmosAccount, gasWantedFees);
  }

  if (
    transaction.memo !== memo ||
    !gasWantedFees.eq(transaction.fees || new BigNumber(0)) ||
    !gasWanted.eq(transaction.gas || new BigNumber(0)) ||
    !amount.eq(transaction.amount)
  ) {
    return {
      ...transaction,
      memo,
      fees: gasWantedFees,
      gas: gasWanted,
      amount,
    };
  }

  return transaction;
};

export default prepareTransaction;
