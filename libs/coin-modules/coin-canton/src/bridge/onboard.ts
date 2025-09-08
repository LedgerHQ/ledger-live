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
  log(`[isAccountOnboarded] Checking if account is onboarded for public key: ${publicKey}`);

  try {
    const { party_id } = await getPartyByPubKey(publicKey);

    if (party_id) {
      log("[isAccountOnboarded] Account is already onboarded", party_id);
      return { party_id };
    } else {
      log("[isAccountOnboarded] Account is not onboarded");
      return false;
    }
  } catch (error) {
    // If we get a 404 or similar error, it means the party doesn't exist (not onboarded)
    log(
      "[isAccountOnboarded] Error checking party status (likely not onboarded):",
      (error as Error).message,
    );
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
          message: "Preparing transactions...",
        });

        const isOnboardedResult = await isAccountOnboarded(keypair.publicKey);
        if (isOnboardedResult && isOnboardedResult.party_id) {
          observer.next({
            partyId: isOnboardedResult.party_id,
            publicKey: keypair.publicKey,
            address: keypair.address,
            transactionHash: "",
          });
          observer.complete();
          return;
        }

        log(
          `[onboardAccount] Calling prepareOnboarding with public key: ${keypair.publicKey} (length: ${keypair.publicKey.length})`,
        );
        const prepared = await prepareOnboarding(keypair.publicKey, "ed25519").catch(err => {
          log(`[onboardAccount] prepareOnboarding failed: ${err}`);
          throw err;
        });

        log(
          `[onboardAccount] prepareOnboarding completed successfully: partyId=${prepared.party_id}, combinedHash=${prepared.transactions?.combined_hash?.substring(0, 20)}...`,
        );

        observer.next({
          status: OnboardStatus.SIGN,
          message: "Signing transactions...",
        });

        log("[onboardAccount] Signing transaction");
        const signature = await signerContext(deviceId, signer =>
          signer.signTransaction(derivationPath, prepared.transactions.combined_hash),
        ).catch(err => {
          log(`[onboardAccount] signTransaction failed: ${err}`);
          throw err;
        });

        log("[onboardAccount] signTransaction completed successfully");
        observer.next({
          status: OnboardStatus.SUBMIT,
          message: "Submitting to network...",
        });

        log("[onboardAccount] Calling submitOnboarding");

        const result = await submitOnboarding(
          { public_key: keypair.publicKey, public_key_type: "ed25519" },
          prepared,
          signature,
        ).catch(err => {
          log(`[onboardAccount] submitOnboarding error: ${err.message}`);
          if (err.message.includes("exists")) {
            log("[onboardAccount] Party already exists - completing immediately");
            observer.next({
              partyId: prepared.party_id,
              publicKey: keypair.publicKey,
              address: keypair.address,
              transactionHash: "",
            });
            return observer.complete();
          }
          log(`[onboardAccount] submitOnboarding failed with non-party-exists error: ${err}`);
          throw err;
        });

        observer.next({
          status: OnboardStatus.SUCCESS,
          message: "Onboarding complete!",
        });
        log("[onboardAccount] About to emit final result and complete");
        observer.next({
          partyId: result?.party?.party_id || "unknown",
          publicKey: keypair.publicKey,
          address: keypair.address,
          transactionHash: signature,
        });
        log("[onboardAccount] Calling observer.complete()");
        observer.complete();
      }

      main().then(
        () => observer.complete(),
        e => observer.error(e),
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
          message: "Preparing transaction pre-approval data...",
        });

        log("[authorizePreapproval] Preparing pre-approval transaction via gateway API");
        const preparedTransaction: PrepareTransactionResponse = await preparePreApprovalTransaction(
          partyId,
        ).catch((err: any) => {
          throw err;
        });

        log(
          `[authorizePreapproval] Transaction prepared successfully: hash=${preparedTransaction.hash}, partyId=${partyId}`,
        );

        observer.next({
          status: PreApprovalStatus.SIGN,
          message: "Please confirm transaction pre-approvals on your device...",
        });

        log(
          `[authorizePreapproval] About to request device signature for hash: ${preparedTransaction.hash}`,
        );
        const signature = await signerContext(deviceId, signer =>
          signer.signTransaction(derivationPath, preparedTransaction.hash),
        ).catch((err: any) => {
          log(`[authorizePreapproval] Device signature failed: ${err}`);
          throw err;
        });

        log("[authorizePreapproval] Device signature obtained successfully");

        observer.next({
          status: PreApprovalStatus.SUBMIT,
          message: "Submitting pre-approvals to network...",
        });

        log("[authorizePreapproval] Calling gateway API to submit transaction");
        const result = await submitPreApprovalTransaction(
          partyId,
          preparedTransaction,
          signature,
        ).catch((err: any) => {
          log(`[authorizePreapproval] Gateway API failed: ${err}`);
          throw err;
        });

        log(
          `[authorizePreapproval] Gateway API completed successfully: approved=${result.approved}, transactionId=${result.transactionId}`,
        );

        if (!result.approved) {
          throw new Error(result.message || "Pre-approval transaction failed");
        }

        observer.next({
          status: PreApprovalStatus.SUCCESS,
          message: "Transaction pre-approvals completed!",
        });

        observer.next({
          approved: result.approved,
          signature,
          transactionId: result.transactionId || "",
          message: result.message || "Transaction pre-approvals signed and submitted successfully",
        });

        const handleTapRequest = async () => {
          const preparedTapRequest = await prepareTapRequest({
            partyId,
            amount: 100000,
            type: "tap-request",
          }).catch((err: any) => {
            log(`[authorizePreapproval] preparedTapRequest failed: ${err}`);
          });
          const preparedTapRequestSignature = await signerContext(deviceId, signer =>
            signer.signTransaction(derivationPath, preparedTapRequest?.hash || ""),
          ).catch((err: any) => {
            log(`[authorizePreapproval] Device signature failed: ${err}`);
          });
          const submittedTapRequest = await submitTapRequest({
            partyId,
            serialized: preparedTapRequest?.serialized || "",
            signature: preparedTapRequestSignature!,
          }).catch((err: any) => {
            log(`[authorizePreapproval] submitTapRequest failed: ${err}`);
          });
          log("[authorizePreapproval] submittedTapRequest", submittedTapRequest);
        };
        await handleTapRequest();

        observer.complete();
      }

      main().then(
        () => observer.complete(),
        (e: any) => observer.error(e),
      );
    });

const log = (message: string, ...rest: any[]) => {
  // eslint-disable-next-line no-console
  console.log(message, ...rest);
};
