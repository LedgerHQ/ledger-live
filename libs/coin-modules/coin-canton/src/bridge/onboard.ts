import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { log } from "@ledgerhq/logs";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";

import {
  prepareOnboarding,
  submitOnboarding,
  getPartyByPubKey,
  preparePreApprovalTransaction,
  submitPreApprovalTransaction,
  getTransferPreApproval,
} from "../network/gateway";
import { signTransaction } from "../common-logic/transaction/sign";
import {
  OnboardStatus,
  AuthorizeStatus,
  CantonOnboardProgress,
  CantonOnboardResult,
  CantonAuthorizeProgress,
  CantonAuthorizeResult,
} from "../types/onboard";
import resolver from "../signer";
import type { CantonSigner } from "../types";

export const isAccountOnboarded = async (currency: CryptoCurrency, publicKey: string) => {
  try {
    const { party_id } = await getPartyByPubKey(currency, publicKey);

    if (party_id) {
      return { isOnboarded: true, partyId: party_id };
    } else {
      return { isOnboarded: false };
    }
  } catch (err) {
    return { isOnboarded: false };
  }
};

export const isCantonCoinPreapproved = async (currency: CryptoCurrency, partyId: string) => {
  const { expires_at, receiver } = await getTransferPreApproval(currency, partyId);
  const isReceiver = receiver === partyId;
  const isExpired = new Date(expires_at) < new Date();

  const isPreapproved = !isExpired && isReceiver;
  return isPreapproved;
};

const createOnboardedAccount = (
  account: Account,
  partyId: string,
  currency: CryptoCurrency,
): Account => ({
  ...account,
  xpub: partyId,
  id: encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: partyId,
    derivationMode: account.derivationMode,
  }),
});

export const buildOnboardAccount =
  (signerContext: SignerContext<CantonSigner>) =>
  (
    currency: CryptoCurrency,
    deviceId: string,
    account: Account,
  ): Observable<CantonOnboardProgress | CantonOnboardResult> =>
    new Observable(o => {
      async function main() {
        o.next({ status: OnboardStatus.INIT });

        const getAddress = resolver(signerContext);
        const { publicKey } = await getAddress(deviceId, {
          path: account.freshAddressPath,
          currency,
          derivationMode: account.derivationMode,
        });

        o.next({ status: OnboardStatus.PREPARE });

        let { partyId } = await isAccountOnboarded(currency, publicKey);
        if (partyId) {
          const onboardedAccount = createOnboardedAccount(account, partyId, currency);
          o.next({ partyId, account: onboardedAccount }); // success
          return;
        }

        const preparedTransaction = await prepareOnboarding(currency, publicKey);
        partyId = preparedTransaction.party_id;

        o.next({ status: OnboardStatus.SIGN });

        const signature = await signerContext(deviceId, async signer => {
          return await signTransaction(signer, account.freshAddressPath, preparedTransaction);
        });

        o.next({ status: OnboardStatus.SUBMIT });

        await submitOnboarding(currency, publicKey, preparedTransaction, signature);

        const onboardedAccount = createOnboardedAccount(account, partyId, currency);
        o.next({ partyId, account: onboardedAccount }); // success
      }

      main().then(
        () => o.complete(),
        error => {
          log("[canton:onboard] onboardAccount failed:", error);

          const handledError = handleDeviceErrors(error);
          o.error(handledError || error);
        },
      );
    });

export const buildAuthorizePreapproval =
  (signerContext: SignerContext<CantonSigner>) =>
  (
    currency: CryptoCurrency,
    deviceId: string,
    account: Account,
    partyId: string,
  ): Observable<CantonAuthorizeProgress | CantonAuthorizeResult> =>
    new Observable(o => {
      async function main() {
        o.next({ status: AuthorizeStatus.INIT });

        const isPreapproved = await isCantonCoinPreapproved(currency, partyId);

        if (!isPreapproved) {
          o.next({ status: AuthorizeStatus.PREPARE });

          const preparedTransaction = await preparePreApprovalTransaction(currency, partyId);

          o.next({ status: AuthorizeStatus.SIGN });

          const signature = await signerContext(deviceId, async signer => {
            return await signTransaction(signer, account.freshAddressPath, preparedTransaction);
          });
          o.next({ status: AuthorizeStatus.SUBMIT });

          await submitPreApprovalTransaction(currency, partyId, preparedTransaction, signature);
        }

        o.next({ isApproved: true }); // success
      }

      main().then(
        () => o.complete(),
        error => {
          log("[canton:onboard] authorizePreapproval failed:", error);

          const handledError = handleDeviceErrors(error);
          o.error(handledError || error);
        },
      );
    });

/**
 * Check if an error is a LockedDeviceError or UserRefusedOnDevice and create user-friendly error messages
 */
const handleDeviceErrors = (error: Error): Error | null => {
  if (error instanceof LockedDeviceError) {
    const lockedDeviceError = new Error("errors.DeviceLockedError.description");
    lockedDeviceError.name = "DeviceLockedError";
    return lockedDeviceError;
  }

  if (error instanceof UserRefusedOnDevice) {
    const userRefusedError = new Error("errors.UserRefusedOnDevice.description");
    userRefusedError.name = "UserRefusedOnDevice";
    return userRefusedError;
  }

  return null;
};
