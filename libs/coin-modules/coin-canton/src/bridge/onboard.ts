import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { log } from "@ledgerhq/logs";
import {
  prepareOnboarding,
  submitOnboarding,
  getPartyByPubKey,
  preparePreApprovalTransaction,
  submitPreApprovalTransaction,
  prepareTapRequest,
  submitTapRequest,
} from "../network/gateway";
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

export const isAccountAuthorized = async (operations: Operation[], partyId: string) => {
  // temporary solution to check if the account is authorized
  return operations.some(operation => operation.senders.includes(partyId));
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
        if (partyId) {
          o.next({ partyId, account }); // success
          return;
        }

        const preparedTransaction = await prepareOnboarding(currency, publicKey);
        partyId = preparedTransaction.party_id;

        o.next({ status: OnboardStatus.SIGN });

        const signature = await signerContext(deviceId, signer =>
          signer.signTransaction(
            account.freshAddressPath,
            preparedTransaction.transactions.combined_hash,
          ),
        );

        o.next({ status: OnboardStatus.SUBMIT });

        await submitOnboarding(currency, publicKey, preparedTransaction, signature);

        o.next({ partyId, account }); // success
      }

      main().then(
        () => o.complete(),
        error => {
          log("[canton:onboard] onboardAccount failed:", error);
          o.error(error);
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

        const isAuthorized = await isAccountAuthorized(account.operations, partyId);

        if (!isAuthorized) {
          o.next({ status: AuthorizeStatus.PREPARE });

          const preparedTransaction = await preparePreApprovalTransaction(currency, partyId);

          o.next({ status: AuthorizeStatus.SIGN });

          const signature = await signerContext(deviceId, signer =>
            signer.signTransaction(account.freshAddressPath, preparedTransaction.hash),
          );

          o.next({ status: AuthorizeStatus.SUBMIT });

          await submitPreApprovalTransaction(currency, partyId, preparedTransaction, signature);
        }

        o.next({ isApproved: true }); // success

        const handleTapRequest = async () => {
          try {
            const { serialized, hash } = await prepareTapRequest(currency, { partyId });

            if (serialized && hash) {
              o.next({ status: AuthorizeStatus.SIGN });

              const signature = await signerContext(deviceId, signer =>
                signer.signTransaction(account.freshAddressPath, hash),
              );

              o.next({ status: AuthorizeStatus.SUBMIT });

              await submitTapRequest(currency, {
                partyId,
                serialized,
                signature,
              });
            }
          } catch (err) {
            // Tap request failure should not break the pre-approval flow
          }
        };
        await handleTapRequest();
      }

      main().then(
        () => o.complete(),
        error => {
          log("[canton:onboard] authorizePreapproval failed:", error);
          o.error(error);
        },
      );
    });
