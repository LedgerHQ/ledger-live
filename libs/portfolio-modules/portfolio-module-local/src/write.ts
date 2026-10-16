import {
  toJsonOperation,
  toJsonSafe,
  type AccountData,
  type AccountOperation,
  type CraftedAccountTransaction,
} from "@ledgerhq/account-module-framework";
import type {
  Balance,
  BroadcastConfig,
  CraftedTransaction,
  FeeEstimation,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
import type {
  ErrorView,
  Network,
  PortfolioApi,
  TransactionIntentView,
  TransactionValidationView,
} from "@ledgerhq/portfolio-module-framework";
import { requireCapability } from "./capabilities";
import { toErrorView } from "./errors";
import { feeParametersOf, parseAmount, toAccountIntent, toCoinIntent } from "./intent";
import { requireLocalNetwork } from "./localNetworks";
import { loadAccountData } from "./stored";
import type { AccountRef, LocalNetwork, LocalPortfolioDeps } from "./types";

type WriteEndpoints = Pick<
  PortfolioApi,
  "estimateTransactionFee" | "encodeTransaction" | "combineTransaction" | "broadcastTransaction"
> &
  Required<Pick<PortfolioApi, "validateTransaction" | "encodeRawTransaction">>;

type AccountTransaction = {
  network: Network;
  account: AccountRef;
  crafted: CraftedAccountTransaction;
};

type SenderAccount = { ref: AccountRef; data: AccountData };

/**
 * The craft and validation options of `customFees`, the fee parameters under them; none without
 * custom fees.
 */
function customFeesOptions(
  intent: TransactionIntentView,
  customFees: string | undefined,
): { customFees?: FeeEstimation } {
  if (customFees === undefined) return {};
  const parameters = feeParametersOf(intent);
  return {
    customFees: {
      value: parseAmount(customFees, "customFees"),
      ...(parameters === undefined ? {} : { parameters }),
    },
  };
}

async function nextSequenceOf(network: LocalNetwork, address: string): Promise<bigint> {
  requireCapability(network, "getNextSequence");
  return network.coinModule.getNextSequence(network.context, address);
}

const errorViews = (errors: Record<string, Error>): Record<string, ErrorView> =>
  Object.fromEntries(Object.entries(errors).map(([key, error]) => [key, toErrorView(error)]));

/** A validation in JSON form: errors and warnings as `ErrorView`s, amounts as decimal strings. */
export const toValidationView = ({
  errors,
  warnings,
  estimatedFees,
  totalFees,
  amount,
  totalSpent,
}: TransactionValidation): TransactionValidationView => ({
  errors: errorViews(errors),
  warnings: errorViews(warnings),
  estimatedFees: estimatedFees.toString(),
  ...(totalFees === undefined ? {} : { totalFees: totalFees.toString() }),
  amount: amount.toString(),
  totalSpent: totalSpent.toString(),
});

/**
 * A sender that is the key of a local account goes through its account module, which crafts with
 * the account's own inputs and change, validates against the account's state and records the
 * broadcast operation; any other sender goes to the coin module, its intent's `data` completed by
 * the coin module.
 */
export function writeEndpoints({ networks, store }: LocalPortfolioDeps): WriteEndpoints {
  /** Account transactions by raw, then also by signed, transaction, until broadcast. */
  const accountTransactions = new Map<string, AccountTransaction>();

  const senderAccount = async (
    name: Network,
    sender: string,
  ): Promise<SenderAccount | undefined> => {
    const ref = await store.findAccount(name, sender);
    const data = ref && (await loadAccountData(store, ref));
    return ref && data && { ref, data };
  };

  const balancesOf = async ({ accountModule, context }: LocalNetwork, { data }: SenderAccount) =>
    (await accountModule.getBalances(context, data)).value;

  const accountTransactionOf = async (name: Network, transaction: string) => {
    const pending = accountTransactions.get(transaction);
    const data = pending?.network === name && (await loadAccountData(store, pending.account));
    return pending && data ? { pending, data } : undefined;
  };

  const craft = async (
    name: Network,
    network: LocalNetwork,
    intent: TransactionIntentView,
    customFees: string | undefined,
  ): Promise<CraftedTransaction & { operation?: AccountOperation }> => {
    const { accountModule, coinModule, context } = network;
    const options = customFeesOptions(intent, customFees);
    const account = await senderAccount(name, intent.sender);
    if (!account) {
      const coinIntent = toCoinIntent(intent, network, [], { completeData: true });
      return coinModule.craftTransaction(context, coinIntent, options);
    }
    const accountIntent = toAccountIntent(intent, network, await balancesOf(network, account));
    const crafted = await accountModule.craftTransaction(
      context,
      account.data,
      accountIntent,
      options,
    );
    accountTransactions.set(crafted.transaction, {
      network: name,
      account: account.ref,
      crafted,
    });
    return crafted;
  };

  const combine = async (
    name: Network,
    { accountModule, coinModule, context }: LocalNetwork,
    rawTransaction: string,
    signatures: string[],
    options: { pubkey?: string },
  ): Promise<string> => {
    const transaction = await accountTransactionOf(name, rawTransaction);
    if (!transaction) return coinModule.combine(context, rawTransaction, signatures, options);
    const { pending, data } = transaction;
    const signed = await accountModule.combine(context, data, pending.crafted, signatures, options);
    accountTransactions.set(signed, pending);
    return signed;
  };

  const broadcast = async (
    name: Network,
    { accountModule, coinModule, context }: LocalNetwork,
    signedTransaction: string,
    broadcastConfig: BroadcastConfig | undefined,
  ): Promise<string> => {
    const options = broadcastConfig ? { broadcastConfig } : undefined;
    const transaction = await accountTransactionOf(name, signedTransaction);
    if (!transaction) return coinModule.broadcast(context, signedTransaction, options);
    const { pending, data } = transaction;
    const operation = await accountModule.broadcast(
      context,
      data,
      signedTransaction,
      pending.crafted,
      options,
    );
    accountTransactions.delete(signedTransaction);
    accountTransactions.delete(pending.crafted.transaction);
    return operation.hash;
  };

  return {
    estimateTransactionFee: async (name, { intent }) => {
      const network = requireLocalNetwork(networks, name);
      const { accountModule, coinModule, context } = network;
      const account = await senderAccount(name, intent.sender);
      const customFeesParameters = feeParametersOf(intent);
      const feeOptions = customFeesParameters === undefined ? undefined : { customFeesParameters };
      const { value, parameters } = account
        ? await accountModule.estimateFees(
            context,
            account.data,
            toAccountIntent(intent, network, await balancesOf(network, account)),
            feeOptions,
          )
        : await coinModule.estimateFees(
            context,
            toCoinIntent(intent, network, [], { completeData: true }),
            feeOptions,
          );
      return {
        value: value.toString(),
        ...(parameters ? { parameters: toJsonSafe(parameters) } : {}),
      };
    },

    /**
     * A local account's intent is validated by its account module, against the balances of the
     * account's stored state (pending spends are the client's to write into that state); any other
     * sender's by the coin module, against the balances the network reports.
     */
    validateTransaction: async (name, { intent, customFees }) => {
      const network = requireLocalNetwork(networks, name);
      const { accountModule, coinModule, context, balanceOptions } = network;
      const options = customFeesOptions(intent, customFees);
      const account = await senderAccount(name, intent.sender);
      if (account) {
        const balances = await balancesOf(network, account);
        const accountIntent = toAccountIntent(intent, network, balances);
        return toValidationView(
          await accountModule.validateIntent(context, account.data, accountIntent, options),
        );
      }
      requireCapability(network, "validateIntent");
      const balances: Balance[] = await coinModule.getBalance(
        context,
        intent.sender,
        ...(balanceOptions ? [balanceOptions] : []),
      );
      const coinIntent = toCoinIntent(intent, network, balances, { completeData: true });
      return toValidationView(
        await coinModule.validateIntent(context, coinIntent, balances, options),
      );
    },

    /**
     * An account module transaction also answers, in `details.operation`, the optimistic operation
     * the module crafted (JSON): a client completes its pending operation from it.
     */
    encodeTransaction: async (name, { intent, customFees }) => {
      const network = requireLocalNetwork(networks, name);
      const { transaction, details, operation } = await craft(name, network, intent, customFees);
      const answered =
        operation === undefined ? details : { ...details, operation: toJsonOperation(operation) };
      return {
        rawTransaction: transaction,
        ...(answered ? { details: toJsonSafe(answered) } : {}),
      };
    },

    /** A transaction built elsewhere, wrapped by the coin module; absent sequence: the network's next one. */
    encodeRawTransaction: async (name, { transaction, sender, senderPublicKey, sequence }) => {
      const network = requireLocalNetwork(networks, name);
      requireCapability(network, "craftRawTransaction");
      const crafted = await network.coinModule.craftRawTransaction(
        network.context,
        transaction,
        sender,
        senderPublicKey,
        sequence === undefined
          ? await nextSequenceOf(network, sender)
          : parseAmount(sequence, "sequence"),
      );
      return {
        rawTransaction: crafted.transaction,
        ...(crafted.details === undefined ? {} : { details: toJsonSafe(crafted.details) }),
      };
    },

    combineTransaction: async (name, { rawTransaction, signature, pubkey }) => {
      const network = requireLocalNetwork(networks, name);
      const options = pubkey === undefined ? {} : { pubkey };
      return {
        signedTransaction: await combine(name, network, rawTransaction, [signature], options),
      };
    },

    broadcastTransaction: async (name, { signedTransaction, broadcastConfig }) => {
      const network = requireLocalNetwork(networks, name);
      return {
        transactionId: await broadcast(name, network, signedTransaction, broadcastConfig),
      };
    },
  };
}
