import { useMemo } from "react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import type { Transaction } from "@ledgerhq/wallet-api-core";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { FAMILIES_MAPPING_WAPI_TO_LL } from "./walletApiCurrencies";
import type { WalletAPIServerSession } from "./useWalletAPIServerCore";
import {
  broadcastSend,
  NoSendingSourceError,
  prepareSend,
  signMessageSend,
  signSend,
  type MessageSignEvent,
  type PreparedSend,
  type SigningDevice,
  type TransactionSignEvent,
} from "@domain/api-account-transaction";
import { SendRequestSchema, type SignedTransaction } from "@domain/entity-account-transaction";
import {
  resolveWalletAPIAccount,
  type WalletAPIAccountTarget,
  type WalletAPIAccountsRootState,
} from "@features/platform-wallet-api-accounts";
import type { Observable } from "rxjs";
import { NotServedByAccountDataError } from "./routeHandlers";
import { toSendRequest } from "./toSendRequest";
import { fetchAccountData } from "@domain/api-account-data";
import { selectAccountReceive, type ReceiveAddress } from "@domain/entity-account-receive";

/** What the host shows to sign a prepared send: it runs `sign` on the device, then reports the result. */
export type AccountDataSignTransactionParams = {
  account: WalletAPIAccountTarget;
  prepared: PreparedSend;
  sign: (device: SigningDevice) => Observable<TransactionSignEvent>;
  onSuccess: (signed: SignedTransaction) => void;
  onCancel: () => void;
  onError: (error: Error) => void;
};

/** What the host shows to sign a message: it runs `sign` on the device, then reports the signature in hex. */
export type AccountDataSignMessageParams = {
  account: WalletAPIAccountTarget;
  messageHex: string;
  sign: (device: SigningDevice) => Observable<MessageSignEvent>;
  onSuccess: (signatureHex: string) => void;
  onCancel: () => void;
  onError: (error: Error) => void;
};

/** What the host shows to receive: the address, verified on the device when `verification` says how. */
export type AccountDataReceiveParams = {
  account: WalletAPIAccountTarget;
  receive: ReceiveAddress;
  onSuccess: (address: string) => void;
  onCancel: () => void;
  onError: (error: Error) => void;
};

/** The host screens the account data handlers open; a handler without its screen is left to the legacy one. */
export type AccountDataUiHook = {
  "transaction.sign"?: (params: AccountDataSignTransactionParams) => void;
  "message.sign"?: (params: AccountDataSignMessageParams) => void;
  "account.receive"?: (params: AccountDataReceiveParams) => void;
};

export type AccountDataDispatch = ThunkDispatch<WalletAPIAccountsRootState, unknown, UnknownAction>;
type Dispatch = AccountDataDispatch;

/** The live app session the handlers serve: a screen settles no request of a closed session. */
export type AccountDataContext = {
  session: Pick<WalletAPIServerSession, "cancelOnClose"> & { assertOpen(): void };
  manifestId: string;
  mevProtected?: boolean;
};

/** The user refused, as the Wallet API names it so live apps can tell it from a failure. */
export class UserRefusedOnDevice extends Error {
  override name = "UserRefusedOnDevice";
}

async function resolve(dispatch: Dispatch, accountId: string, tokenCurrency?: string) {
  const account = await dispatch(resolveWalletAPIAccount(accountId, tokenCurrency));
  if (!account) {
    throw new NotServedByAccountDataError(`Account ${accountId} is not in the entities`);
  }
  return account;
}

/** No source sends from the account: the legacy handler still can. */
async function sendingSource<T>(run: () => T | Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof NoSendingSourceError) throw new NotServedByAccountDataError(error.message);
    throw error;
  }
}

type Settled<T> = {
  onSuccess: (value: T) => void;
  onCancel: () => void;
  onError: (error: Error) => void;
};

/** Opens a host screen once; settles with its first callback, or rejects once the session closes. */
function openOnce<T>(
  context: AccountDataContext,
  open: (callbacks: Settled<T>) => void,
): Promise<T> {
  return context.session.cancelOnClose(
    new Promise<T>((resolveValue, reject) => {
      let done = false;
      const settle = (fn: () => void) => {
        if (done) return;
        done = true;
        fn();
      };
      open({
        onSuccess: value => settle(() => resolveValue(value)),
        onCancel: () => settle(() => reject(new UserRefusedOnDevice())),
        onError: error => settle(() => reject(error)),
      });
    }),
  );
}

const LIVE_FAMILY_OF: Partial<Record<string, string>> = FAMILIES_MAPPING_WAPI_TO_LL;

const familyOfTransaction = (family: string): string => LIVE_FAMILY_OF[family] ?? family;

/** The account data signs with the network app only, a transaction of the account's family. */
function assertPlainSigning(
  account: WalletAPIAccountTarget,
  transaction: Transaction,
  options: { hwAppId?: string; dependencies?: string[] } | undefined,
) {
  if (options?.hwAppId || options?.dependencies?.length) {
    throw new NotServedByAccountDataError("Signing with another device app");
  }
  const currency = getCryptoCurrencyById(currencyIdFromNetwork(account.entry.descriptor.network));
  if (familyOfTransaction(transaction.family) !== currency.family) {
    throw new NotServedByAccountDataError(`A ${transaction.family} transaction on ${currency.id}`);
  }
}

/** The Wallet API handlers the account data serves: each one hands back to legacy what it cannot serve. */
export function useAccountDataHandlers(
  dispatch: AccountDataDispatch,
  ui: AccountDataUiHook,
  context: AccountDataContext,
): Partial<WalletHandlers> {
  const openSign = ui["transaction.sign"];
  const openSignMessage = ui["message.sign"];
  const openReceive = ui["account.receive"];

  return useMemo(() => {
    const prepareSigning = async (params: Parameters<WalletHandlers["transaction.sign"]>[0]) => {
      const account = await resolve(dispatch, params.accountId, params.tokenCurrency);
      assertPlainSigning(account, params.transaction, params.options);
      const request = toSendRequest(account.assetId, params.transaction);
      const prepared = await sendingSource(() =>
        dispatch(prepareSend(account.entry.descriptor, request)),
      );
      return { account, prepared };
    };

    const signWithUi = (
      open: NonNullable<AccountDataUiHook["transaction.sign"]>,
      account: WalletAPIAccountTarget,
      prepared: PreparedSend,
    ) => {
      const sign = dispatch(signSend(prepared));
      return openOnce<SignedTransaction>(context, callbacks =>
        open({ account, prepared, sign, ...callbacks }),
      );
    };

    const handlers: Partial<WalletHandlers> = {
      "bitcoin.getXPub": async ({ accountId }) => {
        const { entry } = await resolve(dispatch, accountId);
        if (entry.descriptor.type !== "utxo") {
          throw new NotServedByAccountDataError("Only UTXO accounts have an xpub");
        }
        return entry.descriptor.xpub;
      },

      "account.getMaxSpendable": async ({ accountId }) => {
        const account = await resolve(dispatch, accountId);
        const { descriptor } = account.entry;
        if (descriptor.type !== "address") {
          throw new NotServedByAccountDataError("A UTXO account needs a recipient to estimate");
        }
        const request = SendRequestSchema.parse({
          assetId: account.assetId,
          recipient: descriptor.address,
          amount: "0",
          useAllAmount: true,
        });
        const { prepared } = await sendingSource(() => dispatch(prepareSend(descriptor, request)));
        // A network refusing a send to itself has no estimate: legacy computes it otherwise.
        if (prepared.errors.length > 0) {
          throw new NotServedByAccountDataError(prepared.errors[0].name);
        }
        return prepared.amount;
      },
    };

    if (openReceive) {
      handlers["account.receive"] = async ({ accountId, tokenCurrency }) => {
        const account = await resolve(dispatch, accountId, tokenCurrency);
        await dispatch(fetchAccountData("receive", account.entry.descriptor));
        const receive = dispatch((_, getState) =>
          selectAccountReceive(getState(), account.entry.accountUUID),
        );
        if (receive?.status !== "ready") {
          throw new NotServedByAccountDataError("The account cannot receive yet");
        }
        return openOnce<string>(context, callbacks =>
          openReceive({ account, receive, ...callbacks }),
        );
      };
    }

    if (openSignMessage) {
      handlers["message.sign"] = async ({ accountId, message }) => {
        const account = await resolve(dispatch, accountId);
        const messageHex = message.toString("hex");
        const sign = await sendingSource(() =>
          dispatch(signMessageSend(account.entry.descriptor, messageHex)),
        );
        const signatureHex = await openOnce<string>(context, callbacks =>
          openSignMessage({ account, messageHex, sign, ...callbacks }),
        );
        return Buffer.from(signatureHex, "hex");
      };
    }

    if (!openSign) return handlers;

    handlers["transaction.sign"] = async params => {
      const { account, prepared } = await prepareSigning(params);
      const signed = await signWithUi(openSign, account, prepared);
      if (!signed.serialized) throw new Error("The source signed without a serialized transaction");
      return Buffer.from(signed.serialized, "hex");
    };

    handlers["transaction.signAndBroadcast"] = async params => {
      const { account, prepared } = await prepareSigning(params);
      const signed = await signWithUi(openSign, account, prepared);
      context.session.assertOpen();
      const { hash } = await dispatch(
        broadcastSend(prepared, signed, {
          mevProtected: context.mevProtected,
          origin: { type: "live-app", name: context.manifestId },
        }),
      );
      return hash;
    };

    return handlers;
  }, [context, dispatch, openReceive, openSign, openSignMessage]);
}
