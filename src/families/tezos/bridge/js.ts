// @flow
import { BigNumber } from "bignumber.js";
import { TezosToolkit, DEFAULT_FEE } from "@taquito/taquito";
import {
  AmountRequired,
  NotEnoughBalance,
  NotEnoughBalanceToDelegate,
  FeeTooHigh,
  NotSupportedLegacyAddress,
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

  let estimatedFees = new BigNumber(t.fees || 0);

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

    if (t.recipient.startsWith("KT") && !errors.recipient) {
      errors.recipient = new NotSupportedLegacyAddress();
    }

    // no fee / not enough balance already handled by taquitoError
    if (!tezosResources.revealed) {
      // FIXME
      // https://github.com/ecadlabs/taquito/commit/48a11cfaffe4c6bdfa6f04ebbd0b756f4b135865#diff-3b138622526cbaa55605b79011aa411652367136a3e92e43faecc654da3854e7
      estimatedFees = estimatedFees.plus(374 || DEFAULT_FEE.REVEAL);
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
    if (t.taquitoError === "proto.010-PtGRANAD.contract.balance_too_low") {
      if (t.mode === "send") {
        errors.amount = new NotEnoughBalance();
      } else {
        errors.amount = new NotEnoughBalanceToDelegate();
      }
    }
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

  const tezos = new TezosToolkit(getEnv("API_TEZOS_NODE"));

  tezos.setProvider({
    signer: {
      publicKeyHash: async () => account.freshAddress,
      publicKey: async () => tezosResources.publicKey,
      sign: () => Promise.reject(new Error("unsupported")),
      secretKey: () => Promise.reject(new Error("unsupported")),
    },
  });

  try {
    if (transaction.useAllAmount) {
      // taquito does not accept 0, so we do 1
      // only failing case is when the account precisely has fees + 1. which is
      // unlikely
      transaction.amount = new BigNumber(1);
    }

    let out;
    switch (transaction.mode) {
      case "send":
        out = await tezos.estimate.transfer({
          to: transaction.recipient,
          amount: transaction.amount.div(10 ** 6).toNumber(),
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
        throw "unsuported";
    }

    transaction.fees = new BigNumber(out.suggestedFeeMutez);
    transaction.gasLimit = new BigNumber(out.gasLimit);
    transaction.storageLimit = new BigNumber(out.storageLimit);

    if (transaction.useAllAmount) {
      // Temporary fix, see https://gitlab.com/tezos/tezos/-/issues/1754
      // we need to increase the gasLimit and fee returned by the estimation
      const gasBuffer = 500;
      const MINIMAL_FEE_PER_GAS_MUTEZ = 0.1;
      const increasedFee = (gasBuffer: number, opSize: number) => {
        return gasBuffer * MINIMAL_FEE_PER_GAS_MUTEZ + opSize
      };
      transaction.fees = transaction.fees.plus(
        increasedFee(gasBuffer, Number(out.opSize))
      );
      transaction.gasLimit = transaction.gasLimit.plus(gasBuffer);
      const s = await getTransactionStatus(account, transaction);
      transaction.amount = account.balance.minus(s.estimatedFees);
    }
  } catch (e: any) {
    transaction.taquitoError = e.id;
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
