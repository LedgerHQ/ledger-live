import { TransportStatusError, UserRefusedOnDevice, LockedDeviceError } from "@ledgerhq/errors";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { Observable } from "rxjs";

import { signTransaction } from "../common-logic/transaction/sign";
import {
  getNetworkType,
  prepareOnboarding,
  submitOnboarding,
  getPartyByPubKey,
  isPartyAlreadyExists,
  prepareTapRequest,
  submitTapRequest,
  preparePreApprovalTransaction,
  submitPreApprovalTransaction,
  getTransferPreApproval,
  clearIsTopologyChangeRequiredCache,
} from "../network/gateway";
import resolver from "../signer";
import type { CantonAccount, CantonSigner } from "../types";
import {
  OnboardStatus,
  AuthorizeStatus,
  CantonOnboardProgress,
  CantonOnboardResult,
  CantonAuthorizeProgress,
  CantonAuthorizeResult,
} from "../types/onboard";

export const isAccountOnboarded = async (currency: CryptoCurrency, publicKey: string) => {
  try {
    const { party_id } = await getPartyByPubKey(currency, publicKey);

    if (party_id) {
      return { isOnboarded: true, partyId: party_id };
    } else {
      return { isOnboarded: false };
    }
  } catch {
    return { isOnboarded: false };
  }
};

// Matches the gateway "party already exists" error, e.g.
// `Party with id "ldg::1220…" already exists and its topology is up to date`, and captures the id.
const PARTY_ALREADY_EXISTS_ID_RE = /party with id\s+"?([^"\s]+)"?\s+already exists/i;

const extractExistingPartyId = (error: unknown): string | undefined =>
  error instanceof Error ? (error.message.match(PARTY_ALREADY_EXISTS_ID_RE)?.[1] ?? undefined) : undefined;

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
): CantonAccount => {
  const cantonAccount = account as CantonAccount;
  return {
    ...cantonAccount,
    xpub: partyId,
    cantonResources: { ...cantonAccount.cantonResources, isOnboarded: true },
    id: encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: partyId,
      derivationMode: account.derivationMode,
    }),
  };
};

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

        // Skip submission only if account is onboarded on network but has no local xpub.
        // For re-onboarding (account has xpub), always proceed to submit a new onboarding transaction.
        if (partyId && !account.xpub) {
          const onboardedAccount = createOnboardedAccount(account, partyId, currency);
          o.next({ partyId, account: onboardedAccount }); // success
          return;
        }

        const preparedTransaction = await prepareOnboarding(currency, publicKey).catch(
          (error: unknown) => {
            // The gateway can report the party "already exists" while getPartyByPubKey still 404s for
            // minutes during its by-public-key indexing lag (e.g. re-adding a just-onboarded account).
            // The party_id is in the error message, so link the existing party directly — instantly,
            // without waiting for the index — instead of failing or creating a duplicate. LIVE-32985
            const existingPartyId = isPartyAlreadyExists(error)
              ? extractExistingPartyId(error)
              : undefined;
            if (existingPartyId) {
              o.next({
                partyId: existingPartyId,
                account: createOnboardedAccount(account, existingPartyId, currency),
              }); // success (linked existing party, no submission)
              return undefined;
            }
            throw error;
          },
        );

        if (!preparedTransaction) {
          return; // linked an already-existing party above; nothing left to sign/submit
        }

        partyId = preparedTransaction.party_id;

        o.next({ status: OnboardStatus.SIGN });

        const signature = await signerContext(deviceId, async signer => {
          return await signTransaction(signer, account.freshAddressPath, preparedTransaction);
        });

        o.next({ status: OnboardStatus.SUBMIT });

        await submitOnboarding(currency, publicKey, preparedTransaction, signature);

        clearIsTopologyChangeRequiredCache(currency, publicKey);

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

          const { signature } = await signerContext(deviceId, async signer => {
            return await signTransaction(signer, account.freshAddressPath, preparedTransaction);
          });
          o.next({ status: AuthorizeStatus.SUBMIT });

          await submitPreApprovalTransaction(currency, partyId, preparedTransaction, signature);
        }

        o.next({ isApproved: true }); // success

        if (getNetworkType(currency) !== "mainnet") {
          const handleTapRequest = async () => {
            try {
              const { serialized, hash } = await prepareTapRequest(currency, { partyId });

              if (serialized && hash) {
                o.next({ status: AuthorizeStatus.SIGN });

                const { signature } = await signerContext(deviceId, signer =>
                  signer.signTransaction(account.freshAddressPath, hash),
                );

                o.next({ status: AuthorizeStatus.SUBMIT });

                await submitTapRequest(currency, {
                  partyId,
                  serialized,
                  signature,
                });
              }
            } catch {
              // Tap request failure should not break the pre-approval flow
            }
          };
          await handleTapRequest();
        }
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
  if (error instanceof TransportStatusError) {
    if (error.statusCode === 0x6985) {
      const userRefusedError = new UserRefusedOnDevice("errors.UserRefusedOnDevice.description");
      return userRefusedError;
    }
    if (error.statusCode === 0x5515) {
      const lockedDeviceError = new LockedDeviceError("errors.LockedDeviceError.description");
      return lockedDeviceError;
    }
  }

  return null;
};
