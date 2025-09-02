import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CantonSigner } from "../types/signer";
import {
  prepareOnboarding,
  submitOnboarding,
  getPartyByPubKey,
  preparePreApprovalTransaction,
  submitPreApprovalTransaction,
} from "../network/gateway";
import { generateMockKeyPair, createMockSigner } from "../test/cantonTestUtils";
import {
  OnboardStatus,
  PreApprovalStatus,
  CantonOnboardProgress,
  CantonOnboardResult,
  CantonPreApprovalProgress,
  CantonPreApprovalResult,
  PrepareTransactionResponse,
} from "../types/onboard";

const isDevSignerMode = false;

async function getKeypair(
  signerContext: SignerContext<CantonSigner>,
  deviceId: string,
  derivationPath: string,
) {
  if (!isDevSignerMode) {
    return signerContext(deviceId, async signer => {
      const { publicKey, address } = await signer.getAddress(derivationPath);
      return { signer, publicKey: publicKey.replace("0x", ""), address };
    });
  }

  const keyPair = generateMockKeyPair();
  const signer = createMockSigner(keyPair);
  const { publicKey, address } = await signer.getAddress(derivationPath);
  return { signer, publicKey, address };
}

async function createSignature(
  keypair: any,
  hash: string,
  derivationPath: string,
  signerContext: SignerContext<CantonSigner>,
  deviceId: string,
): Promise<string> {
  // Extract raw hash from multihash format if needed
  // Canton Gateway returns multihash format: <algorithm><length><hash>
  // Device expects exactly 32 bytes of raw hash
  let processedHash = hash;

  // Remove '0x' prefix if present
  if (processedHash.startsWith("0x")) {
    processedHash = processedHash.substring(2);
  }

  // Check if this is a multihash format (starts with algorithm identifier)
  if (processedHash.length > 64) {
    log(`[createSignature] Detected multihash format ${processedHash}`);
    // Skip first 4 characters (2 bytes): algorithm (1 byte) + length (1 byte)
    // processedHash = processedHash.substring(4);
  }

  // Ensure hash is exactly 32 bytes (64 hex characters)
  // if (processedHash.length !== 64) {
  //   throw new Error(
  //     `Invalid hash length: expected 64 hex chars (32 bytes), got ${processedHash.length}`,
  //   );
  // }

  log(
    `[createSignature] Using hash: ${processedHash.substring(0, 16)}...${processedHash.substring(48)}`,
  );

  const signature = !isDevSignerMode
    ? await signerContext(deviceId, signer => signer.signTransaction(derivationPath, processedHash))
    : await keypair.signer.signTransaction(derivationPath, processedHash);

  return signature.replace("0x", "");
}

export const buildIsAccountOnboarded =
  (signerContext: SignerContext<CantonSigner>) =>
  (deviceId: string, derivationPath: string, publicKey: string): Observable<boolean> =>
    new Observable(observer => {
      async function main() {
        const keypair = await getKeypair(signerContext, deviceId, derivationPath);
        const pk = isDevSignerMode ? keypair.publicKey : publicKey;

        log(`[isAccountOnboarded] Checking if account is onboarded for public key: ${pk}`);
        const { party_id } = await getPartyByPubKey(pk);

        if (party_id) {
          log("[isAccountOnboarded] Account is already onboarded", party_id);
          return { party_id };
        } else {
          log("[isAccountOnboarded] Account is not onboarded");
          return false;
        }
      }

      main().catch(error => observer.error(error));
    });

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
        }

        log(`[onboardAccount] Calling prepareOnboarding with public key: ${keypair.publicKey}`);
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

        log("[onboardAccount] Calling createSignature");
        const signature = await createSignature(
          keypair,
          prepared.transactions.combined_hash,
          derivationPath,
          signerContext,
          deviceId,
        ).catch(err => {
          log(`[onboardAccount] createSignature failed: ${err}`);
          throw err;
        });

        log("[onboardAccount] createSignature completed successfully");
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

        log(
          `[onboardAccount] submitOnboarding completed successfully: partyId=${result?.party?.party_id || "unknown"}`,
        );

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
    validatorId: string,
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
          validatorId,
        ).catch((err: any) => {
          log(`[authorizePreapproval] Failed to prepare transaction: ${err}`);
          throw err;
        });

        log(
          `[authorizePreapproval] Transaction prepared successfully: hash=${preparedTransaction.hash}, partyId=${partyId}, validatorId=${validatorId}`,
        );

        observer.next({
          status: PreApprovalStatus.SIGN,
          message: "Please confirm transaction pre-approvals on your device...",
        });

        log(
          `[authorizePreapproval] About to request device signature for hash: ${preparedTransaction.hash}`,
        );
        const keypair = await getKeypair(signerContext, deviceId, derivationPath);
        const signature = await createSignature(
          keypair,
          preparedTransaction.hash,
          derivationPath,
          signerContext,
          deviceId,
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
          validatorId,
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
