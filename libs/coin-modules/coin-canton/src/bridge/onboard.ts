import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { getDerivationModesForCurrency } from "@ledgerhq/coin-framework/derivation";
import { getAccountShape } from "./sync";
import { CantonAccount, CantonSigner } from "../types";
import type { Account, DerivationMode } from "@ledgerhq/types-live";
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
  PreApprovalStatus,
  CantonOnboardProgress,
  CantonOnboardResult,
  CantonPreApprovalProgress,
  CantonPreApprovalResult,
  PrepareTransactionResponse,
} from "../types/onboard";
import resolver from "../signer";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

async function _getKeypair(
  signerContext: SignerContext<CantonSigner>,
  deviceId: string,
  derivationPath: string,
) {
  return signerContext(deviceId, async signer => {
    const { publicKey, address } = await signer.getAddress(derivationPath);
    return { signer, publicKey: publicKey.replace("0x", ""), address };
  });
}

export const isAccountOnboarded = async (
  currency: CryptoCurrency,
  publicKey: string,
): Promise<{ isOnboarded: boolean; party_id?: string }> => {
  try {
    const { party_id } = await getPartyByPubKey(currency, publicKey);

    if (party_id) {
      return { isOnboarded: true, party_id };
    } else {
      return { isOnboarded: false };
    }
  } catch (err) {
    log("[isAccountOnboarded] Error checking party status (likely not onboarded):", err);
    return { isOnboarded: false };
  }
};

export const buildOnboardAccount =
  (signerContext: SignerContext<CantonSigner>) =>
  (
    currency: CryptoCurrency,
    deviceId: string,
    derivationPath: string,
  ): Observable<CantonOnboardProgress | CantonOnboardResult> =>
    new Observable(observer => {
      async function main() {
        observer.next({
          status: OnboardStatus.INIT,
        });
        const derivationMode = getDerivationModesForCurrency(currency)[0];
        const getAddress = resolver(signerContext);
        const { address, publicKey } = await getAddress(deviceId, {
          path: derivationPath,
          currency,
          derivationMode: derivationMode || "",
        });

        observer.next({
          status: OnboardStatus.PREPARE,
        });

        const { party_id: partyId } = await isAccountOnboarded(currency, publicKey);
        if (partyId) {
          const account = await createAccount({
            address,
            derivationPath,
            partyId,
            currency,
            derivationMode,
          });
          observer.next({
            partyId,
            account,
          });
          observer.complete();
          return;
        }

        const preparedTransaction = await prepareOnboarding(currency, publicKey, "ed25519");

        observer.next({
          status: OnboardStatus.SIGN,
        });

        const signature = await signerContext(deviceId, signer =>
          signer.signTransaction(derivationPath, preparedTransaction.transactions.combined_hash),
        );

        observer.next({
          status: OnboardStatus.SUBMIT,
        });

        const result = await submitOnboarding(
          currency,
          { public_key: publicKey, public_key_type: "ed25519" },
          preparedTransaction,
          signature,
        ).catch(async err => {
          if (err.type === "PARTY_ALREADY_EXISTS") {
            const account = await createAccount({
              address,
              derivationPath,
              partyId: preparedTransaction.party_id,
              currency,
              derivationMode,
            });
            observer.next({
              partyId: preparedTransaction.party_id,
              account,
            });
            return observer.complete();
          }
          throw err;
        });

        if (result) {
          observer.next({
            status: OnboardStatus.SUCCESS,
          });
          const account = await createAccount({
            address,
            derivationPath,
            partyId: result.party.party_id,
            currency,
            derivationMode,
          });
          observer.next({
            partyId: result.party.party_id,
            account,
          });
        }

        observer.complete();
      }

      main().then(
        () => observer.complete(),
        error => {
          log("[onboardAccount] Error:", error);
          observer.error(error);
        },
      );
    });

export const buildAuthorizePreapproval =
  (signerContext: SignerContext<CantonSigner>) =>
  (
    currency: CryptoCurrency,
    deviceId: string,
    derivationPath: string,
    partyId: string,
  ): Observable<CantonPreApprovalProgress | CantonPreApprovalResult> =>
    new Observable(observer => {
      async function main() {
        observer.next({
          status: PreApprovalStatus.PREPARE,
        });

        const preparedTransaction: PrepareTransactionResponse = await preparePreApprovalTransaction(
          currency,
          partyId,
        );

        observer.next({
          status: PreApprovalStatus.SIGN,
        });

        const signature = await signerContext(deviceId, signer =>
          signer.signTransaction(derivationPath, preparedTransaction.hash),
        );

        observer.next({
          status: PreApprovalStatus.SUBMIT,
        });

        const { isApproved } = await submitPreApprovalTransaction(
          currency,
          partyId,
          preparedTransaction,
          signature,
        );

        observer.next({
          status: PreApprovalStatus.SUCCESS,
        });

        observer.next({
          isApproved,
        });

        const handleTapRequest = async () => {
          try {
            const { serialized, hash } = await prepareTapRequest(currency, {
              partyId,
            });

            if (serialized && hash) {
              observer.next({
                status: PreApprovalStatus.SIGN,
              });

              const signature = await signerContext(deviceId, signer =>
                signer.signTransaction(derivationPath, hash),
              );

              observer.next({
                status: PreApprovalStatus.SUBMIT,
              });

              await submitTapRequest(currency, {
                partyId,
                serialized,
                signature,
              });

              observer.next({
                status: PreApprovalStatus.SUCCESS,
              });
            }
          } catch (err) {
            // Tap request failure should not break the pre-approval flow
          }
        };
        await handleTapRequest();

        observer.complete();
      }

      main().then(
        () => observer.complete(),
        error => {
          log("[buildAuthorizePreapproval] Error:", error);
          observer.error(error);
        },
      );
    });

const createAccount = async ({
  address,
  partyId,
  derivationPath,
  currency,
  derivationMode,
  index = 0,
}: {
  address: string;
  derivationPath: string;
  partyId: string;
  currency: CryptoCurrency;
  derivationMode: DerivationMode;
  index?: number;
}): Promise<Partial<Account>> => {
  const accountShape = await getAccountShape(
    {
      address,
      currency,
      derivationMode,
      derivationPath,
      index,
      rest: {
        cantonResources: {
          partyId,
        },
      },
    },
    { paginationConfig: {} },
  );

  const account: Partial<CantonAccount> = {
    ...accountShape,
    type: "Account",
    xpub: partyId.replace(/:/g, "_"),
    index,
    // operations: [],
    currency,
    derivationMode,
    lastSyncDate: new Date(),
    pendingOperations: [],
    seedIdentifier: address,
    balanceHistoryCache: emptyHistoryCache,
    cantonResources: {
      partyId,
    },
  };

  return account;
};

const log = (message: string, ...rest: unknown[]) => {
  // eslint-disable-next-line no-console
  console.log(message, ...rest);
};
