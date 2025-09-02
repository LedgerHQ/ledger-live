import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CantonSigner } from "../types/signer";
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

async function getKeypair(
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
  publicKey: string,
): Promise<false | { party_id: string }> => {
  try {
    const { party_id } = await getPartyByPubKey(publicKey);

    if (party_id) {
      return { party_id };
    } else {
      return false;
    }
  } catch (err) {
    log("[isAccountOnboarded] Error checking party status (likely not onboarded):", err);
    return false;
  }
};

export const buildOnboardAccount =
  (signerContext: SignerContext<CantonSigner>) =>
  (
    deviceId: string,
    derivationPath: string,
  ): Observable<CantonOnboardProgress | CantonOnboardResult> =>
    new Observable(observer => {
      async function main() {
        observer.next({
          status: OnboardStatus.INIT,
        });
        const keypair = await getKeypair(signerContext, deviceId, derivationPath);

        observer.next({
          status: OnboardStatus.PREPARE,
        });

        const isOnboardedResult = await isAccountOnboarded(keypair.publicKey);
        if (isOnboardedResult && isOnboardedResult.party_id) {
          observer.next({
            partyId: isOnboardedResult.party_id,
          });
          observer.complete();
          return;
        }

        const preparedTransaction = await prepareOnboarding(keypair.publicKey, "ed25519");

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
          { public_key: keypair.publicKey, public_key_type: "ed25519" },
          preparedTransaction,
          signature,
        ).catch(err => {
          if (err.type === "PARTY_ALREADY_EXISTS") {
            observer.next({
              partyId: preparedTransaction.party_id,
            });
            return observer.complete();
          }
          throw err;
        });

        observer.next({
          status: OnboardStatus.SUCCESS,
        });

        observer.next({
          partyId: result?.party?.party_id || "unknown",
        });

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
    deviceId: string,
    derivationPath: string,
    partyId: string,
  ): Observable<CantonPreApprovalProgress | CantonPreApprovalResult> =>
    new Observable(observer => {
      async function main() {
        observer.next({
          status: PreApprovalStatus.PREPARE,
        });

        const preparedTransaction: PrepareTransactionResponse =
          await preparePreApprovalTransaction(partyId);

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

        // TODO: remove after demo
        const handleTapRequest = async () => {
          try {
            observer.next({
              status: PreApprovalStatus.PREPARE,
            });

            const { serialized, hash } = await prepareTapRequest({
              partyId,
            });

            observer.next({
              status: PreApprovalStatus.SIGN,
            });

            const signature = await signerContext(deviceId, signer =>
              signer.signTransaction(derivationPath, hash),
            );

            observer.next({
              status: PreApprovalStatus.SUBMIT,
            });

            await submitTapRequest({
              partyId,
              serialized,
              signature,
            });

            observer.next({
              status: PreApprovalStatus.SUCCESS,
            });
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

const log = (message: string, ...rest: any[]) => {
  // eslint-disable-next-line no-console
  console.log(message, ...rest);
};
