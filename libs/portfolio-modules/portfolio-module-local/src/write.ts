import { toJsonSafe, type CraftedAccountTransaction } from "@ledgerhq/account-module-framework";
import type { CraftedTransaction } from "@ledgerhq/coin-module-framework/api/types";
import type {
  Network,
  PortfolioApi,
  TransactionIntentView,
} from "@ledgerhq/portfolio-module-framework";
import { parseAmount, toAccountIntent, toCoinIntent } from "./intent";
import { requireLocalNetwork } from "./localNetworks";
import { loadAccountData } from "./stored";
import type { AccountRef, LocalNetwork, LocalPortfolioDeps } from "./types";

type WriteEndpoints = Pick<
  PortfolioApi,
  "estimateTransactionFee" | "encodeTransaction" | "combineTransaction" | "broadcastTransaction"
>;

type AccountTransaction = {
  network: Network;
  account: AccountRef;
  crafted: CraftedAccountTransaction;
};

/**
 * A sender that is the key of a local account goes through its account module, which crafts with
 * the account's own inputs and change, and records the broadcast operation; any other sender goes
 * to the coin module.
 */
export function writeEndpoints({ networks, store }: LocalPortfolioDeps): WriteEndpoints {
  /** Account transactions by raw, then also by signed, transaction, until broadcast. */
  const accountTransactions = new Map<string, AccountTransaction>();

  const senderAccount = async (name: Network, sender: string) => {
    const ref = await store.findAccount(name, sender);
    const data = ref && (await loadAccountData(store, ref));
    return ref && data && { ref, data };
  };

  const accountTransactionOf = async (name: Network, transaction: string) => {
    const pending = accountTransactions.get(transaction);
    const data = pending?.network === name && (await loadAccountData(store, pending.account));
    return pending && data ? { pending, data } : undefined;
  };

  const craft = async (
    name: Network,
    { accountModule, coinModule, context }: LocalNetwork,
    intent: TransactionIntentView,
    customFees: string | undefined,
  ): Promise<CraftedTransaction> => {
    const options =
      customFees === undefined
        ? {}
        : { customFees: { value: parseAmount(customFees, "customFees") } };
    const account = await senderAccount(name, intent.sender);
    if (!account) return coinModule.craftTransaction(context, toCoinIntent(intent), options);
    const crafted = await accountModule.craftTransaction(
      context,
      account.data,
      toAccountIntent(intent),
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
  ): Promise<string> => {
    const transaction = await accountTransactionOf(name, signedTransaction);
    if (!transaction) return coinModule.broadcast(context, signedTransaction);
    const { pending, data } = transaction;
    const operation = await accountModule.broadcast(
      context,
      data,
      signedTransaction,
      pending.crafted,
    );
    accountTransactions.delete(signedTransaction);
    accountTransactions.delete(pending.crafted.transaction);
    return operation.hash;
  };

  return {
    estimateTransactionFee: async (name, { intent }) => {
      const { accountModule, coinModule, context } = requireLocalNetwork(networks, name);
      const account = await senderAccount(name, intent.sender);
      const { value, parameters } = account
        ? await accountModule.estimateFees(context, account.data, toAccountIntent(intent))
        : await coinModule.estimateFees(context, toCoinIntent(intent));
      return {
        value: value.toString(),
        ...(parameters ? { parameters: toJsonSafe(parameters) } : {}),
      };
    },

    encodeTransaction: async (name, { intent, customFees }) => {
      const network = requireLocalNetwork(networks, name);
      const { transaction, details } = await craft(name, network, intent, customFees);
      return { rawTransaction: transaction, ...(details ? { details: toJsonSafe(details) } : {}) };
    },

    combineTransaction: async (name, { rawTransaction, signature, pubkey }) => {
      const network = requireLocalNetwork(networks, name);
      const options = pubkey === undefined ? {} : { pubkey };
      return {
        signedTransaction: await combine(name, network, rawTransaction, [signature], options),
      };
    },

    broadcastTransaction: async (name, { signedTransaction }) => {
      const network = requireLocalNetwork(networks, name);
      return { transactionId: await broadcast(name, network, signedTransaction) };
    },
  };
}
