// @flow
import { BigNumber } from "bignumber.js";
import { TezosToolkit, DEFAULT_FEE, DEFAULT_STORAGE_LIMIT, Estimate } from "@taquito/taquito";
import { DerivationType } from "@taquito/ledger-signer";
import { compressPublicKey } from "@taquito/ledger-signer/dist/lib/utils";
import { b58cencode, prefix, Prefix, validateAddress, ValidationResult } from "@taquito/utils";
import {
  AmountRequired,
  NotEnoughBalance,
  NotEnoughBalanceToDelegate,
  FeeTooHigh,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecommendUndelegation,
  NotEnoughBalanceBecauseDestinationNotCreated,
  RecipientRequired,
  InvalidAddress,
} from "@ledgerhq/errors";
import type { CurrencyBridge, AccountBridge, Account, AccountLike } from "@ledgerhq/types-live";
import { makeSync, makeScanAccounts, makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getMainAccount } from "../../../account";
import type { TezosAccount, Transaction, TransactionStatus } from "../types";
import { getAccountShape } from "../synchronisation";
import { fetchAllBakers, hydrateBakers, isAccountDelegating } from "../bakers";
import { getEnv } from "@ledgerhq/live-env";
import { signOperation } from "../signOperation";
import { patchOperationWithHash } from "../../../operation";
import { log } from "@ledgerhq/logs";
import { InvalidAddressBecauseAlreadyDelegated } from "../../../errors";
import api from "../api/tzkt";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";

const validateRecipient = (currency, recipient) => {
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

const receive = makeAccountBridgeReceive();

const EXISTENTIAL_DEPOSIT = new BigNumber(275000);

const createTransaction: () => Transaction = () => ({
  family: "tezos",
  mode: "send",
  amount: new BigNumber(0),
  fees: null,
  gasLimit: null,
  storageLimit: null,
  recipient: "",
  networkInfo: null,
  useAllAmount: false,
  taquitoError: null,
  estimatedFees: null,
});

const getTransactionStatus = async (
  account: TezosAccount,
  tx: Transaction,
): Promise<TransactionStatus> => {
  const errors: {
    recipient?: Error;
    amount?: Error;
    fees?: Error;
  } = {};

  const warnings: {
    amount?: Error;
    feeTooHigh?: Error;
    recipient?: Error;
  } = {};
  let resetTotalSpent = false;

  // Recipient validation logic
  if (tx.mode !== "undelegate") {
    if (account.freshAddress === tx.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else {
      const { recipientError, recipientWarning } = await validateRecipient(
        account.currency,
        tx.recipient,
      );
      if (recipientError) {
        errors.recipient = recipientError;
      }
      if (recipientWarning) {
        warnings.recipient = recipientWarning;
      }
    }
  }

  // Pre validation of amount field
  const estimatedFees = tx.estimatedFees || new BigNumber(0);
  if (tx.mode === "send") {
    if (!errors.amount && tx.amount.eq(0) && !tx.useAllAmount) {
      resetTotalSpent = true;
      errors.amount = new AmountRequired();
    } else if (tx.amount.gt(0) && estimatedFees.times(10).gt(tx.amount)) {
      warnings.feeTooHigh = new FeeTooHigh();
    }
    const thresholdWarning = 0.5 * 10 ** account.currency.units[0].magnitude;
    if (
      !errors.amount &&
      account.balance.minus(tx.amount).minus(estimatedFees).lt(thresholdWarning)
    ) {
      if (isAccountDelegating(account)) {
        if (tx.useAllAmount) {
          errors.amount = new RecommendUndelegation();
        } else {
          warnings.amount = new RecommendUndelegation();
        }
      }
    }
  }

  // effective amount
  // if we also have taquitoError, we interprete them and they override the previously inferred errors
  if (tx.taquitoError) {
    log("taquitoerror", String(tx.taquitoError));

    // remap taquito errors
    if (
      tx.taquitoError.endsWith("balance_too_low") ||
      tx.taquitoError.endsWith("subtraction_underflow")
    ) {
      if (tx.mode === "send") {
        resetTotalSpent = true;
        errors.amount = new NotEnoughBalance();
      } else {
        errors.amount = new NotEnoughBalanceToDelegate();
      }
    } else if (tx.taquitoError.endsWith("delegate.unchanged")) {
      errors.recipient = new InvalidAddressBecauseAlreadyDelegated();
    } else if (!errors.amount) {
      // unidentified error case
      errors.amount = new Error(tx.taquitoError);
      resetTotalSpent = true;
    }
  }

  if (!errors.amount && account.balance.lte(0)) {
    resetTotalSpent = true;
    errors.amount = new NotEnoughBalance();
  }

  // Catch a specific case that requires a minimum amount
  if (
    !errors.amount &&
    tx.mode === "send" &&
    tx.amount.lt(EXISTENTIAL_DEPOSIT) &&
    (await api.getAccountByAddress(tx.recipient)).type === "empty"
  ) {
    resetTotalSpent = true;
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: "0.275 XTZ",
    });
  }

  const result = {
    errors,
    warnings,
    estimatedFees,
    amount: tx.amount,
    totalSpent: resetTotalSpent ? new BigNumber(0) : tx.amount.plus(estimatedFees),
  };

  return Promise.resolve(result);
};

const prepareTransaction = async (
  account: TezosAccount,
  transaction: Transaction,
): Promise<Transaction> => {
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
      case "send": {
        estimate = await tezos.estimate.transfer({
          mutez: true,
          to: transaction.recipient,
          amount: amount.toNumber(),
          storageLimit: DEFAULT_STORAGE_LIMIT.ORIGINATION, // https://github.com/TezTech/eztz/blob/master/PROTO_003_FEES.md for originating an account
        });
        break;
      }
      case "delegate": {
        estimate = await tezos.estimate.setDelegate({
          source: account.freshAddress,
          delegate: transaction.recipient,
        });
        break;
      }
      case "undelegate": {
        estimate = await tezos.estimate.setDelegate({
          source: account.freshAddress,
        });
        break;
      }
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
      tx.fees = tx.fees.plus(DEFAULT_FEE.REVEAL);
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

function bnEq(a: BigNumber | null | undefined, b: BigNumber | null | undefined): boolean {
  return !a && !b ? true : !a || !b ? false : a.eq(b);
}

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | undefined;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount) as TezosAccount;
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    ...transaction,
    // estimate using a burn address that exists so we don't enter into NotEnoughBalanceBecauseDestinationNotCreated
    recipient: transaction?.recipient || "tz1burnburnburnburnburnburnburjAYjjX",
    useAllAmount: true,
  });

  const s = await getTransactionStatus(mainAccount, t);
  return s.amount;
};

const broadcast = async ({ signedOperation: { operation, signature } }) => {
  const tezos = new TezosToolkit(getEnv("API_TEZOS_NODE"));
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const hash = await tezos.contract.context.injector.inject(signature);
  return patchOperationWithHash(operation, hash);
};

const scanAccounts = makeScanAccounts({ getAccountShape });

const sync = makeSync({ getAccountShape });

const getPreloadStrategy = _currency => ({
  preloadMaxAge: 30 * 1000,
});

const preload = async () => {
  const bakers = await fetchAllBakers();
  return { bakers };
};

const hydrate = (data: any) => {
  if (!data || typeof data !== "object") return;
  const { bakers } = data;
  if (!bakers || typeof bakers !== "object" || !Array.isArray(bakers)) return;
  hydrateBakers(bakers);
};

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload,
  hydrate,
  scanAccounts,
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  prepareTransaction,
  estimateMaxSpendable,
  getTransactionStatus,
  sync,
  receive,
  signOperation,
  broadcast,
  assignToAccountRaw,
  assignFromAccountRaw,
};

export default { currencyBridge, accountBridge };
