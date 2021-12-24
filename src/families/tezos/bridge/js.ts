// @flow
import { BigNumber } from "bignumber.js";
import { TezosToolkit, DEFAULT_FEE } from "@taquito/taquito";
import {
  AmountRequired,
  NotEnoughBalance,
  NotEnoughBalanceToDelegate,
  FeeTooHigh,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecommendUndelegation,
} from "@ledgerhq/errors";
import { validateRecipient } from "../../../bridge/shared";
import type {
  CurrencyBridge,
  AccountBridge,
  Account,
  TransactionStatus,
  AccountLike,
} from "../../../types";
import {
  makeSync,
  makeScanAccounts,
  makeAccountBridgeReceive,
} from "../../../bridge/jsHelpers";
import { getMainAccount } from "../../../account";
import type { Transaction } from "../types";
import { getAccountShape } from "../synchronisation";
import { fetchAllBakers, hydrateBakers, isAccountDelegating } from "../bakers";
import { getEnv } from "../../../env";
import { signOperation } from "../signOperation";
import { patchOperationWithHash } from "../../../operation";
import { log } from "@ledgerhq/logs";

const receive = makeAccountBridgeReceive();

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

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const getTransactionStatus = async (
  account: Account,
  t: Transaction
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

  const estimatedFees = t.estimatedFees || new BigNumber(0);

  const { tezosResources } = account;
  if (!tezosResources) throw new Error("tezosResources is missing");

  if (!t.taquitoError) {
    if (t.mode !== "undelegate") {
      if (account.freshAddress === t.recipient) {
        errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
      } else {
        const { recipientError, recipientWarning } = await validateRecipient(
          account.currency,
          t.recipient
        );

        if (recipientError) {
          errors.recipient = recipientError;
        }

        if (recipientWarning) {
          warnings.recipient = recipientWarning;
        }
      }
    }

    if (t.mode === "send") {
      if (!errors.amount && t.amount.eq(0)) {
        errors.amount = new AmountRequired();
      } else if (!errors.amount && t.amount.lt(0)) {
        errors.amount = new NotEnoughBalance();
      } else if (t.amount.gt(0) && estimatedFees.times(10).gt(t.amount)) {
        warnings.feeTooHigh = new FeeTooHigh();
      }

      const thresholdWarning = 0.5 * 10 ** account.currency.units[0].magnitude;

      if (
        !errors.amount &&
        account.balance
          .minus(t.amount)
          .minus(estimatedFees)
          .lt(thresholdWarning)
      ) {
        if (isAccountDelegating(account)) {
          warnings.amount = new RecommendUndelegation();
        }
      }
    }
  } else {
    log("taquitoerror", String(t.taquitoError));

    // remap taquito errors
    if (t.taquitoError.endsWith("balance_too_low")) {
      if (t.mode === "send") {
        errors.amount = new NotEnoughBalance();
      } else {
        errors.amount = new NotEnoughBalanceToDelegate();
      }
    } else {
      // unidentified error case
      errors.amount = new Error(t.taquitoError);
    }
  }

  if (!errors.amount && account.balance.lte(0)) {
    errors.amount = new NotEnoughBalance();
  }

  const result = {
    errors,
    warnings,
    estimatedFees,
    amount: t.amount,
    totalSpent: t.amount.plus(estimatedFees),
  };
  return Promise.resolve(result);
};

const prepareTransaction = async (
  account: Account,
  transaction: Transaction
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
    const { recipientError } = await validateRecipient(
      account.currency,
      transaction.recipient
    );
    if (recipientError) {
      return Promise.resolve(transaction);
    }
  }

  const tezos = new TezosToolkit(getEnv("API_TEZOS_NODE"));
  tezos.setProvider({
    signer: {
      publicKeyHash: async () => account.freshAddress,
      publicKey: async () => tezosResources.publicKey,
      sign: () => Promise.reject(new Error("unsupported")),
      secretKey: () => Promise.reject(new Error("unsupported")),
    },
  });

  if (transaction.useAllAmount) {
    // taquito does not accept 0, so we do 1
    // only failing case is when the account precisely has fees + 1. which is
    // unlikely
    transaction.amount = new BigNumber(1);
  }

  try {
    let out;
    switch (transaction.mode) {
      case "send":
        out = await tezos.estimate.transfer({
          mutez: true,
          to: transaction.recipient,
          amount: transaction.amount.toNumber(),
        });
        break;
      case "delegate":
        out = await tezos.estimate.setDelegate({
          source: account.freshAddress,
          delegate: transaction.recipient,
        });
        break;
      case "undelegate":
        out = await tezos.estimate.setDelegate({
          source: account.freshAddress,
        });
        break;
      default:
        throw new Error("unsupported mode=" + transaction.mode);
    }

    if (transaction.useAllAmount) {
      const totalFees = out.suggestedFeeMutez + out.burnFeeMutez;
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
      const incr = increasedFee(gasBuffer, Number(out.opSize));
      transaction.fees = new BigNumber(out.suggestedFeeMutez + incr);
      transaction.gasLimit = new BigNumber(out.gasLimit + gasBuffer);
      transaction.amount = new BigNumber(maxAmount - incr);
    } else {
      transaction.fees = new BigNumber(out.suggestedFeeMutez);
      transaction.gasLimit = new BigNumber(out.gasLimit);
      transaction.storageLimit = new BigNumber(out.storageLimit);
    }

    transaction.storageLimit = new BigNumber(out.storageLimit);
    transaction.estimatedFees = transaction.fees;
    if (!tezosResources.revealed) {
      transaction.estimatedFees = transaction.estimatedFees.plus(
        DEFAULT_FEE.REVEAL
      );
    }
  } catch (e) {
    if (typeof e !== "object" || !e) throw e;
    if ("id" in e) {
      transaction.taquitoError = (e as { id: string }).id;
    } else if ("status" in e) {
      // in case of http 400, log & ignore (more case to handle)
      log(
        "taquito-network-error",
        String((e as { message: string }).message || ""),
        { transaction }
      );
    } else {
      throw e;
    }
  }

  return transaction;
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | undefined;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    ...transaction,
    // this seed is empty (worse case scenario is to send to new). addr from: 1. eyebrow 2. odor 3. rice 4. attack 5. loyal 6. tray 7. letter 8. harbor 9. resemble 10. sphere 11. system 12. forward 13. onion 14. buffalo 15. crumble
    recipient: transaction?.recipient || "tz1VJitLYB31fEC82efFkLRU4AQUH9QgH3q6",
    useAllAmount: true,
  });
  const s = await getTransactionStatus(mainAccount, t);
  return s.amount;
};

const broadcast = async ({ signedOperation: { operation } }) => {
  const tezos = new TezosToolkit(getEnv("API_TEZOS_NODE"));
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const hash = await tezos.contract.context.injector.inject(
    operation.extra.opbytes
  );
  return patchOperationWithHash(operation, hash);
};

const scanAccounts = makeScanAccounts(getAccountShape);

const sync = makeSync(getAccountShape);

const getPreloadStrategy = (_currency) => ({
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
  updateTransaction,
  prepareTransaction,
  estimateMaxSpendable,
  getTransactionStatus,
  sync,
  receive,
  signOperation,
  broadcast,
};

export default { currencyBridge, accountBridge };
