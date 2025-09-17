import { Observable } from "rxjs";
import { filter, map, tap } from "rxjs/operators";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import type { Account, CurrencyBridge } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
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
  PrepareTransactionResponse,
} from "../types/onboard";
import resolver from "../signer";
import type { CantonAccount, CantonSigner } from "../types";

export const getAccountStatus = async (currency: CryptoCurrency, publicKey: string) => {
  try {
    const { party_id } = await getPartyByPubKey(currency, publicKey);

    if (party_id) {
      return { isOnboarded: true, partyId: party_id };
    } else {
      return { isOnboarded: false };
    }
  } catch (err) {
    console.warn(
      `[canton:getAccountStatus] Failed to getPartyByPubKey with ${currency.id} and ${publicKey}):`,
      err,
    );
    return { isOnboarded: false };
  }
};

export const buildOnboardAccount =
  (signerContext: SignerContext<CantonSigner>, scanAccounts?: CurrencyBridge["scanAccounts"]) =>
  (
    currency: CryptoCurrency,
    deviceId: string,
    creatableAccount: Account,
    existingAccounts?: Account[],
  ): Observable<CantonOnboardProgress | CantonOnboardResult> =>
    new Observable(observer => {
      async function main() {
        observer.next({
          status: OnboardStatus.INIT,
        });

        console.log(
          "buildOnboardAccount",
          "creatableAccount",
          creatableAccount,
          "existingAccounts",
          existingAccounts,
          "derivationPath",
        );
        const getAddress = resolver(signerContext);
        const { address, publicKey } = await getAddress(deviceId, {
          path: creatableAccount.freshAddressPath,
          currency,
          derivationMode: creatableAccount.derivationMode,
        });

        console.log("scanAccounts", scanAccounts);

        let onboardableAccount = creatableAccount;

        if (scanAccounts && !creatableAccount.used) {
          console.log("DEBUG - scanAccounts creatableAccount", creatableAccount);
          scanAccounts({
            currency,
            deviceId: deviceId,
            syncConfig: {
              paginationConfig: {
                operations: 0,
              },
              blacklistedTokenIds: [],
            },
          })
            .pipe(
              tap(e => console.log("DEBUG - scanAccounts event:", e.type, e)),
              filter(e => e.type === "discovered"),
              map(e => e.account),
            )
            .subscribe({
              next: async scannedAccount => {
                console.log("DEBUG - Found scanned account:", scannedAccount);

                // Check if this account is already onboarded to Canton
                try {
                  // Get the public key from the freshAddressPath
                  const { publicKey } = await getAddress(deviceId, {
                    path: scannedAccount.freshAddressPath,
                    currency,
                    derivationMode: scannedAccount.derivationMode,
                  });
                  console.log("DEBUG - Public key:", publicKey);
                  const onboardedStatus = await getAccountStatus(currency, publicKey);
                  console.log("DEBUG - Account onboarded status:", onboardedStatus);

                  if (onboardedStatus.isOnboarded) {
                    console.log("DEBUG - Account is already onboarded, continuing scan...");
                    // If this account is already onboarded, continue scanning
                    return;
                  }

                  // Found an account that's not onboarded, use it for onboarding
                  console.log(
                    "DEBUG - Found non-onboarded account, proceeding with onboarding scannedAccount",
                    scannedAccount,
                  );

                  onboardableAccount = scannedAccount;
                } catch (error) {
                  console.error("DEBUG - Error checking onboarded status:", error);

                  return;
                }
              },
              complete: () => {
                console.log("DEBUG - scanAccounts completed");
              },
              error: error => {
                console.error("DEBUG - scanAccounts error:", error);
              },
            });
          console.log("DEBUG - scanAccounts call completed");
        } else {
          console.log("DEBUG - scanAccounts is undefined, skipping scan");
        }

        if (onboardableAccount) {
          observer.next({
            status: OnboardStatus.INIT,
          });

          observer.next({
            status: OnboardStatus.PREPARE,
          });

          const { partyId } = await getAccountStatus(currency, publicKey);
          if (partyId) {
            const account = await createAccount(creatableAccount);
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
            signer.signTransaction(
              creatableAccount.freshAddressPath,
              preparedTransaction.transactions.combined_hash,
            ),
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
              const account = await createAccount(creatableAccount);
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
            const account = await createAccount(creatableAccount);
            observer.next({
              partyId: result.party.party_id,
              account,
            });
          }

          observer.complete();
        }
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
    creatableAccount: Account,
    partyId: string,
  ): Observable<CantonAuthorizeProgress | CantonAuthorizeResult> =>
    new Observable(observer => {
      async function main() {
        log("buildAuthorizePreapproval", "creatableAccount", creatableAccount, "partyId", partyId);
        observer.next({
          status: AuthorizeStatus.PREPARE,
        });

        const preparedTransaction: PrepareTransactionResponse = await preparePreApprovalTransaction(
          currency,
          partyId,
        );

        observer.next({
          status: AuthorizeStatus.SIGN,
        });

        const signature = await signerContext(deviceId, signer =>
          signer.signTransaction(creatableAccount.freshAddressPath, preparedTransaction.hash),
        );

        observer.next({
          status: AuthorizeStatus.SUBMIT,
        });

        const { isApproved } = await submitPreApprovalTransaction(
          currency,
          partyId,
          preparedTransaction,
          signature,
        );

        observer.next({
          status: AuthorizeStatus.SUCCESS,
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
                status: AuthorizeStatus.SIGN,
              });

              const signature = await signerContext(deviceId, signer =>
                signer.signTransaction(creatableAccount.freshAddressPath, hash),
              );

              observer.next({
                status: AuthorizeStatus.SUBMIT,
              });

              await submitTapRequest(currency, {
                partyId,
                serialized,
                signature,
              });

              observer.next({
                status: AuthorizeStatus.SUCCESS,
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

const createAccount = async (creatableAccount: Account): Promise<Partial<Account>> => {
  console.log("createAccount", creatableAccount);
  const account: Partial<CantonAccount> = {
    ...creatableAccount,
    lastSyncDate: new Date(),
    pendingOperations: [],
    // seedIdentifier: address,
    balanceHistoryCache: emptyHistoryCache,
    // cantonResources: {
    //   partyId,
    // },
  };

  console.log("account", account);

  return account;
};

const log = (message: string, ...rest: unknown[]) => {
  // eslint-disable-next-line no-console
  console.log(message, ...rest);
};
