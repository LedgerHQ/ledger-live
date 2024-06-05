import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { getEnv } from "@ledgerhq/live-env";
import { AccountBridge } from "@ledgerhq/types-live";
import { DerivationType } from "@taquito/ledger-signer";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { InvalidAddress, RecipientRequired } from "@ledgerhq/errors";
import { compressPublicKey } from "@taquito/ledger-signer/dist/lib/utils";
import { b58cencode, prefix, Prefix, validateAddress, ValidationResult } from "@taquito/utils";
import { DEFAULT_FEE, DEFAULT_STORAGE_LIMIT, Estimate, TezosToolkit } from "@taquito/taquito";
import { TezosAccount, Transaction } from "../types";

function bnEq(a: BigNumber | null | undefined, b: BigNumber | null | undefined): boolean {
  return !a && !b ? true : !a || !b ? false : a.eq(b);
}

export const validateRecipient = (currency: CryptoCurrency, recipient: string) => {
  let recipientError: Error | null = null;
  const recipientWarning = null;
  if (!recipient) {
    recipientError = new RecipientRequired("");
  } else if (validateAddress(recipient) !== ValidationResult.VALID) {
    recipientError = new InvalidAddress(undefined, {
      currencyName: currency.name,
    });
  }
  return Promise.resolve({ recipientError, recipientWarning });
};

export const prepareTransaction: AccountBridge<
  Transaction,
  TezosAccount
>["prepareTransaction"] = async (account, transaction) => {
  const { tezosResources } = account;
  if (!tezosResources) throw new Error("tezosResources is missing");

  if (account.balance.lte(0)) {
    return Promise.resolve(transaction);
  }

  // basic check to confirm the transaction is "complete"
  if (transaction.mode !== "undelegate") {
    if (!transaction.recipient) {
      return Promise.resolve(transaction);
    }

    const { recipientError } = await validateRecipient(account.currency, transaction.recipient);
    if (recipientError) {
      return Promise.resolve(transaction);
    }
  }

  const encodedPubKey = b58cencode(
    compressPublicKey(Buffer.from(account.xpub || "", "hex"), DerivationType.ED25519),
    prefix[Prefix.EDPK],
  );

  const tezos = new TezosToolkit(getEnv("API_TEZOS_NODE"));

  tezos.setProvider({
    signer: {
      publicKeyHash: async () => account.freshAddress,
      publicKey: async () => encodedPubKey,
      sign: () => Promise.reject(new Error("unsupported")),
      secretKey: () => Promise.reject(new Error("unsupported")),
    },
  });

  const tx: Transaction = { ...transaction, taquitoError: null };

  let amount = transaction.amount;
  if (transaction.useAllAmount) {
    amount = new BigNumber(1); // send max do a pre-estimation with minimum amount (taquito refuses 0)
  }

  try {
    let estimate: Estimate;
    switch (transaction.mode) {
      case "send":
        estimate = await tezos.estimate.transfer({
          mutez: true,
          to: transaction.recipient,
          amount: amount.toNumber(),
          storageLimit: DEFAULT_STORAGE_LIMIT.ORIGINATION, // https://github.com/TezTech/eztz/blob/master/PROTO_003_FEES.md for originating an account
        });
        break;
      case "delegate":
        estimate = await tezos.estimate.setDelegate({
          source: account.freshAddress,
          delegate: transaction.recipient,
        });
        break;
      case "undelegate":
        estimate = await tezos.estimate.setDelegate({
          source: account.freshAddress,
        });
        break;
      default:
        throw new Error("unsupported mode=" + transaction.mode);
    }

    if (tx.useAllAmount) {
      const totalFees = estimate.suggestedFeeMutez + estimate.burnFeeMutez;
      const maxAmount = account.balance
        .minus(totalFees + (tezosResources.revealed ? 0 : DEFAULT_FEE.REVEAL))
        .toNumber();
      // from https://github.com/ecadlabs/taquito/blob/a70c64c4b105381bb9f1d04c9c70e8ef26e9241c/integration-tests/contract-empty-implicit-account-into-new-implicit-account.spec.ts#L33
      // Temporary fix, see https://gitlab.com/tezos/tezos/-/issues/1754
      // we need to increase the gasLimit and fee returned by the estimation
      const gasBuffer = 500;
      const MINIMAL_FEE_PER_GAS_MUTEZ = 0.1;
      const increasedFee = (gasBuffer: number, opSize: number) => {
        return gasBuffer * MINIMAL_FEE_PER_GAS_MUTEZ + opSize;
      };
      const incr = increasedFee(gasBuffer, Number(estimate.opSize));
      tx.fees = new BigNumber(estimate.suggestedFeeMutez + incr);
      tx.gasLimit = new BigNumber(estimate.gasLimit + gasBuffer);
      tx.amount = maxAmount - incr > 0 ? new BigNumber(maxAmount - incr) : new BigNumber(0);
    } else {
      tx.fees = new BigNumber(estimate.suggestedFeeMutez);
      tx.gasLimit = new BigNumber(estimate.gasLimit);
      tx.storageLimit = new BigNumber(estimate.storageLimit);
    }

    tx.storageLimit = new BigNumber(estimate.storageLimit);
    tx.estimatedFees = tx.fees;
    if (!tezosResources.revealed) {
      tx.estimatedFees = tx.estimatedFees.plus(DEFAULT_FEE.REVEAL);
    }
  } catch (e) {
    if (typeof e !== "object" || !e) throw e;
    if ("id" in e) {
      tx.taquitoError = (e as { id: string }).id;
      log("taquito-error", "taquito got error " + tx.taquitoError);
    } else if ("status" in e) {
      // in case of http 400, log & ignore (more case to handle)
      log("taquito-network-error", String((e as unknown as { message: string }).message || ""), {
        transaction: tx,
      });
      throw e;
    } else {
      throw e;
    }
  }

  // nothing changed
  if (
    bnEq(tx.estimatedFees, transaction.estimatedFees) &&
    bnEq(tx.fees, transaction.fees) &&
    bnEq(tx.gasLimit, transaction.gasLimit) &&
    bnEq(tx.storageLimit, transaction.storageLimit) &&
    bnEq(tx.amount, transaction.amount) &&
    tx.taquitoError === transaction.taquitoError
  ) {
    return transaction;
  }

  return tx;
};

export default prepareTransaction;
