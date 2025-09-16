import { Observable } from "rxjs";
import { filter, map, tap } from "rxjs/operators";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { getDerivationModesForCurrency } from "@ledgerhq/coin-framework/derivation";
import {
  getDerivationScheme,
  runAccountDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import type { Account, CurrencyBridge, DerivationMode } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { makeGetAccountShape } from "./sync";

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
import type { CantonAccount, CantonSigner } from "../types";

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
        const derivationMode = getDerivationModesForCurrency(currency)[0];
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
          console.log("DEBUG - scanAccounts is defined, calling it...");
          console.log("DEBUG - Currency:", currency.id);
          console.log("DEBUG - creatableAccount:", creatableAccount);
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
                console.log("DEBUG - Account used:", scannedAccount.used);
                console.log("DEBUG - Account operations count:", scannedAccount.operationsCount);
                console.log("DEBUG - Account balance:", scannedAccount.balance.toString());

                // Check if this account is already onboarded to Canton
                try {
                  // Get the public key from the freshAddressPath
                  const { publicKey } = await getAddress(deviceId, {
                    path: scannedAccount.freshAddressPath,
                    currency,
                    derivationMode: scannedAccount.derivationMode,
                  });
                  console.log("DEBUG - Public key:", publicKey);
                  const onboardedStatus = await isAccountOnboarded(currency, publicKey);
                  console.log("DEBUG - Account onboarded status:", onboardedStatus);

                  // If this account is already onboarded, continue scanning
                  if (onboardedStatus.isOnboarded) {
                    console.log("DEBUG - Account is already onboarded, continuing scan...");
                    return;
                  }

                  // Found an account that's not onboarded, use it for onboarding
                  console.log("DEBUG - Found non-onboarded account, proceeding with onboarding");
                  const accountIndex = scannedAccount.index;
                  const derivationMode = scannedAccount.derivationMode;
                  const derivationScheme = getDerivationScheme({ derivationMode, currency });
                  const derivationPath = runAccountDerivationScheme(derivationScheme, currency, {
                    account: accountIndex,
                  });

                  onboardableAccount = scannedAccount;

                  console.log("DEBUG - Using account index from scanning:", accountIndex);
                  console.log("DEBUG - derivationPath:", derivationPath);
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

          const { party_id: partyId } = await isAccountOnboarded(publicKey);
          if (partyId) {
            const account = await createAccount({
              address,
              currency,
              derivationMode: creatableAccount.derivationMode,
              derivationPath: creatableAccount.freshAddressPath,
              partyId,
              signerContext,
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
              const account = await createAccount({
                address,
                currency,
                derivationMode: creatableAccount.derivationMode,
                derivationPath: creatableAccount.freshAddressPath,
                partyId: preparedTransaction.party_id,
                signerContext,
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
              currency,
              derivationMode: creatableAccount.derivationMode,
              derivationPath: creatableAccount.freshAddressPath,
              partyId: preparedTransaction.party_id,
              signerContext,
            });
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
          signer.signTransaction(creatableAccount.freshAddressPath, preparedTransaction.hash),
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
                signer.signTransaction(creatableAccount.freshAddressPath, hash),
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

// Extract account index from derivation path
const extractAccountIndexFromPath = (derivationPath: string): number => {
  // For Canton: 44'/6767'/<account>'/0'/0'
  // We need to extract the <account> part
  const parts = derivationPath.split("/");
  if (parts.length >= 3) {
    const accountPart = parts[2]; // This should be something like "0'"
    const accountIndex = parseInt(accountPart.replace("'", ""), 10);
    return isNaN(accountIndex) ? 0 : accountIndex;
  }
  return 0;
};

const createAccount = async ({
  address,
  currency,
  derivationMode,
  partyId,
  derivationPath,
  index = 0,
  signerContext,
}: {
  address: string;
  currency: CryptoCurrency;
  derivationMode: DerivationMode;
  derivationPath: string;
  partyId: string;
  index?: number;
  signerContext?: any;
}): Promise<Partial<Account>> => {
  // Use provided index or extract from derivation path
  const accountIndex = index !== undefined ? index : extractAccountIndexFromPath(derivationPath);
  const getAccountShape = makeGetAccountShape(signerContext);
  const accountShape = await getAccountShape(
    {
      address,
      currency,
      derivationMode,
      derivationPath,
      index: accountIndex,
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
    index: accountIndex,
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
