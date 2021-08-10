import { Observable, from } from "rxjs";
import { tap } from "rxjs/operators";
import Transport from "@ledgerhq/hw-transport";
import { StatusCodes } from "@ledgerhq/hw-transport";
import { UpdateYourApp } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type {
  AccountBridge,
  Account,
  CryptoCurrency,
  SignedOperation,
  Transaction,
  DerivationMode,
  SignOperationEvent,
} from "../types";
import type { Core, CoreAccount, CoreCurrency, CoreWallet } from "./types";
import { withDevice } from "../hw/deviceAccess";
import { toTransactionRaw, toSignOperationEventRaw } from "../transaction";
import { getCoreAccount } from "./getCoreAccount";
import { remapLibcoreErrors } from "./errors";
import { withLibcore } from "./access";

export type Arg<T, CT> = {
  buildTransaction: (arg0: {
    account: Account;
    core: Core;
    coreCurrency: CoreCurrency;
    coreAccount: CoreAccount;
    coreWallet: CoreWallet;
    transaction: T;
    isPartial: boolean;
    isCancelled: () => boolean;
  }) => Promise<CT | null | undefined>;
  signTransaction: (arg0: {
    account: Account;
    subAccountId: string | null | undefined;
    transport: Transport;
    currency: CryptoCurrency;
    derivationMode: DerivationMode;
    coreCurrency: CoreCurrency;
    transaction: T;
    coreTransaction: CT;
    coreAccount: CoreAccount;
    isCancelled: () => boolean;
    onDeviceStreaming: (arg0: {
      progress: number;
      index: number;
      total: number;
    }) => void;
    onDeviceSignatureRequested: () => void;
    onDeviceSignatureGranted: () => void;
  }) => Promise<SignedOperation | null | undefined>;
};

type SignOperation<T extends Transaction> = AccountBridge<T>["signOperation"];

export const makeSignOperation =
  <T extends Transaction, CT>({
    buildTransaction,
    signTransaction,
  }: Arg<T, CT>): SignOperation<T> =>
  ({ account, transaction, deviceId }) =>
    Observable.create((o) => {
      let cancelled = false;
      withLibcore(async (core) => {
        if (cancelled) return;
        const { currency, derivationMode } = account;
        const { coreAccount, coreWallet } = await getCoreAccount(core, account);
        if (cancelled) return;
        const coreCurrency = await coreWallet.getCurrency();
        if (cancelled) return;
        log("libcore", "buildTransaction", toTransactionRaw(transaction));
        const builded = await buildTransaction({
          account,
          core,
          coreCurrency,
          coreAccount,
          transaction,
          coreWallet,
          isPartial: false,
          isCancelled: () => cancelled,
        });
        if (cancelled || !builded) return;
        const signedOperation = await withDevice(deviceId)((transport) =>
          from(
            signTransaction({
              account,
              subAccountId: transaction.subAccountId,
              transport,
              currency,
              derivationMode,
              coreCurrency,
              coreAccount,
              transaction,
              coreTransaction: builded,
              isCancelled: () => cancelled,
              onDeviceStreaming: ({ progress, index, total }) =>
                o.next({
                  type: "device-streaming",
                  progress,
                  index,
                  total,
                }),
              onDeviceSignatureRequested: () =>
                o.next({
                  type: "device-signature-requested",
                }),
              onDeviceSignatureGranted: () =>
                o.next({
                  type: "device-signature-granted",
                }),
            }).catch((e) => {
              // TODO where to remap this generically???
              if (e && e.statusCode === StatusCodes.INCORRECT_P1_P2) {
                throw new UpdateYourApp(
                  `UpdateYourApp ${currency.id}`,
                  currency
                );
              }

              throw e;
            })
          )
        ).toPromise();
        if (cancelled || !signedOperation) return;
        o.next({
          type: "signed",
          signedOperation,
        });
      }).then(
        () => o.complete(),
        (e) => o.error(remapLibcoreErrors(e))
      );
      return () => {
        cancelled = true;
      };
    }).pipe(
      tap((e: SignOperationEvent) =>
        log("signOperation", "event " + e.type, toSignOperationEventRaw(e))
      )
    );
