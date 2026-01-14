import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { LockedDeviceError, TransportStatusError, UserRefusedOnDevice } from "@ledgerhq/errors";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { CONCORDIUM_CHAIN_IDS, CONCORDIUM_ID_APP_MOBILE_HOST } from "../constants";
import {
  getConcordiumNetwork,
  isAccountOnboarded,
  signCredentialDeployment,
} from "../network/onboard";
import { getWalletConnectContext } from "../network/walletConnect";
import resolver from "../signer";
import type { ConcordiumAccount, ConcordiumResources, ConcordiumSigner } from "../types";
import type { SerializedCredentialDeploymentDetails } from "../types/onboard";
import {
  AccountOnboardStatus,
  ConcordiumOnboardProgress,
  ConcordiumOnboardResult,
  ConcordiumPairingProgress,
  ConcordiumPairingStatus,
  IDAppErrorCode,
} from "../types/onboard";

/**
 * Create an onboarded account with Concordium-specific resources
 *
 * @param account - Base account
 * @param accountAddress - On-chain account address
 * @param currency - Concordium currency
 * @param options - Optional fields for concordiumResources
 */
const createOnboardedAccount = (
  account: Account,
  accountAddress: string,
  currency: CryptoCurrency,
  options?: {
    credId?: string;
    identityIndex?: number;
    credNumber?: number;
    ipIdentity?: number;
    publicKey?: string;
    bip32Address?: string; // BIP32-derived address for device matching
  },
): ConcordiumAccount => {
  const onboardedAccount = {
    ...account,
    xpub: accountAddress,
    freshAddress: accountAddress,
    // For Concordium, use BIP32-derived address as seedIdentifier for device-account matching
    // This matches what the device returns from getAddress() for validation
    ...(options?.bip32Address && { seedIdentifier: options.bip32Address }),
    id: encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: accountAddress,
      derivationMode: account.derivationMode,
    }),
    concordiumResources: {
      isOnboarded: true,
      accountAddress,
      credId: options?.credId || "",
      publicKey: options?.publicKey || "",
      identityIndex: options?.identityIndex ?? 0,
      credNumber: options?.credNumber ?? 0,
      ipIdentity: options?.ipIdentity ?? 0,
    },
  };

  return onboardedAccount;
};

export const buildOnboardAccount =
  (signerContext: SignerContext<ConcordiumSigner>) =>
  (
    currency: CryptoCurrency,
    deviceId: string,
    account: Account,
  ): Observable<ConcordiumOnboardProgress | ConcordiumOnboardResult> =>
    new Observable(o => {
      async function main() {
        const walletConnectContext = getWalletConnectContext();
        if (!walletConnectContext) {
          throw new Error(
            "WalletConnect context not available. Please ensure Concordium WalletConnect service is initialized.",
          );
        }

        o.next({ status: AccountOnboardStatus.INIT });

        const getAddress = resolver(signerContext);
        // Get both the BIP32-derived address and publicKey from the device
        // NOTE: For Concordium, the BIP32-derived address is NOT the on-chain address.
        // It's used solely for device-account matching (stored in seedIdentifier).
        const { address: bip32Address, publicKey } = await getAddress(deviceId, {
          path: account.freshAddressPath,
          currency,
          derivationMode: account.derivationMode,
        });

        o.next({ status: AccountOnboardStatus.PREPARE });

        // Check if account is already onboarded using credential ID (browser wallet approach)
        const concordiumResources =
          "concordiumResources" in account && account.concordiumResources
            ? (account.concordiumResources as ConcordiumResources)
            : undefined;
        const credId =
          concordiumResources && typeof concordiumResources.credId === "string"
            ? concordiumResources.credId
            : undefined;

        if (credId) {
          const { isOnboarded, accountAddress: existingAddress } = await isAccountOnboarded(
            currency,
            publicKey,
            credId,
          );

          // If account is already onboarded AND exists on-chain, skip account creation
          // If account is marked as onboarded locally but doesn't exist on-chain yet,
          // proceed with onboarding to finalize the credential deployment transaction
          if (isOnboarded && existingAddress) {
            // Preserve existing verify address data from concordiumResources
            const onboardedAccount = createOnboardedAccount(account, existingAddress, currency, {
              ...(credId !== undefined && { credId }),
              ...(concordiumResources?.identityIndex !== undefined && {
                identityIndex: concordiumResources.identityIndex,
              }),
              ...(concordiumResources?.credNumber !== undefined && {
                credNumber: concordiumResources.credNumber,
              }),
              ...(concordiumResources?.ipIdentity !== undefined && {
                ipIdentity: concordiumResources.ipIdentity,
              }),
              ...(concordiumResources?.publicKey !== undefined && {
                publicKey: concordiumResources.publicKey,
              }),
              bip32Address, // Use freshly obtained BIP32 address for device matching
            });
            o.next({ accountAddress: existingAddress, account: onboardedAccount });
            return;
          }
        }

        const network = getConcordiumNetwork(currency);
        const createRequest = walletConnectContext.getCreateAccountCreationRequest(
          publicKey,
          "Create Concordium account from Ledger Live",
        );

        const session = await walletConnectContext.getSession(network);
        if (!session) {
          throw new Error(
            `No active WalletConnect session for ${network}. Please pair with Concordium IDApp first.`,
          );
        }

        const chainId = CONCORDIUM_CHAIN_IDS[network];
        const response = await walletConnectContext.requestAccountCreation({
          topic: session.topic,
          chainId,
          method: "create_account",
          params: { message: createRequest },
        });

        // Handle explicit error response
        if (response.status === "error") {
          const errorMessage =
            "details" in response.message ? response.message.details : "unknown error";

          // Handle case where account already exists - this can happen if account was onboarded
          // in a previous session but local state wasn't updated
          if (
            "code" in response &&
            response.code === IDAppErrorCode.DuplicateAccountCreationRequest
          ) {
            const accountAddress = account.xpub || account.freshAddress;

            if (accountAddress?.length > 0) {
              // Preserve existing data if available
              const existingCredId =
                typeof concordiumResources?.credId === "string"
                  ? concordiumResources.credId
                  : undefined;
              const onboardedAccount = createOnboardedAccount(account, accountAddress, currency, {
                ...(existingCredId !== undefined && { credId: existingCredId }),
                ...(concordiumResources?.identityIndex !== undefined && {
                  identityIndex: concordiumResources.identityIndex,
                }),
                ...(concordiumResources?.credNumber !== undefined && {
                  credNumber: concordiumResources.credNumber,
                }),
                ...(concordiumResources?.ipIdentity !== undefined && {
                  ipIdentity: concordiumResources.ipIdentity,
                }),
                ...(concordiumResources?.publicKey !== undefined && {
                  publicKey: concordiumResources.publicKey,
                }),
                bip32Address, // Use freshly obtained BIP32 address for device matching
              });
              o.next({ accountAddress, account: onboardedAccount });
              return;
            }

            throw new Error(
              `Account with this public key already exists on the network. The account may have been onboarded in a previous session. Please try syncing your accounts or restart the onboarding process.`,
            );
          }

          throw new Error(`IDApp create_account failed: ${errorMessage}`);
        }

        // Handle unexpected structure for "success" response
        if (
          response.status !== "success" ||
          !("serializedCredentialDeploymentTransaction" in response.message) ||
          !("accountAddress" in response.message)
        ) {
          throw new Error(
            "Invalid response from IDApp: serializedCredentialDeploymentTransaction is missing or invalid. Please try again.",
          );
        }

        const { serializedCredentialDeploymentTransaction, accountAddress } = response.message;

        const randomness =
          typeof serializedCredentialDeploymentTransaction.randomness === "string"
            ? JSON.parse(serializedCredentialDeploymentTransaction.randomness)
            : serializedCredentialDeploymentTransaction.randomness;

        const serializedTransaction: SerializedCredentialDeploymentDetails = {
          expiry: Number(serializedCredentialDeploymentTransaction.expiry),
          unsignedCdiStr: serializedCredentialDeploymentTransaction.unsignedCdiStr,
          randomness,
        };

        o.next({ status: AccountOnboardStatus.SIGN });

        // Sign credential deployment on device
        // Note: The device app doesn't support exporting account signing keys,
        // so we must sign directly on device. Both approaches sign the same digest,
        // so the signatures are compatible with browser wallet format.
        const signatureResult = await signCredentialDeployment(
          signerContext,
          deviceId,
          account.freshAddressPath,
          serializedTransaction,
        );

        if (
          !signatureResult?.signature ||
          signatureResult.signature.length === 0 ||
          !signatureResult.signature[0] ||
          signatureResult.signature[0].length === 0
        ) {
          throw new Error("Failed to obtain signature from device");
        }

        o.next({ status: AccountOnboardStatus.SUBMIT });

        // Note: Device signs with first key (key index 0), signature should be at signatures[0]
        // Convert signature array to single signature string format expected by web SDK
        // hw-app-concordium returns signature as string[], but web SDK expects single hex string
        const signature = signatureResult.signature.join("");
        const txHash = await walletConnectContext.submitCCDTransaction(
          {
            expiry: BigInt(serializedTransaction.expiry),
            unsignedCdiStr: serializedTransaction.unsignedCdiStr,
            randomness: serializedTransaction.randomness,
          },
          signature,
          currency,
        );

        // Extract credential info from unsignedCdiStr and IDApp response to save with the account
        const unsignedCdi: { credId?: string; ipIdentity?: number } = JSON.parse(
          serializedTransaction.unsignedCdiStr,
        );
        const extractedCredentialId = unsignedCdi.credId;

        // Get ipIdentity from credential deployment transaction
        const ipIdentity = unsignedCdi.ipIdentity;
        if (typeof ipIdentity !== "number") {
          throw new Error("Invalid ipIdentity in credential deployment transaction");
        }

        // Use identityIndex/credNumber from IDApp response if provided, otherwise default to 0
        // For initial onboarding, identityIndex = 0 (first identity) and credNumber = 0 (first credential)
        const identityIndex = response.message.identityIndex ?? 0;
        const credNumber = response.message.credNumber ?? 0;

        const onboardedAccount = createOnboardedAccount(account, accountAddress, currency, {
          ...(extractedCredentialId !== undefined && { credId: extractedCredentialId }),
          identityIndex,
          credNumber,
          ipIdentity,
          publicKey,
          bip32Address, // Use BIP32-derived address for device-account matching
        });

        const result: ConcordiumOnboardResult = {
          accountAddress,
          account: onboardedAccount,
          txHash,
          ...(extractedCredentialId && { credId: extractedCredentialId }),
        };

        o.next(result);
      }

      main().then(
        () => o.complete(),
        error => {
          const handledError = handleDeviceErrors(error);
          o.error(handledError || error);
        },
      );
    });

const APPROVAL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const buildPairWalletConnect =
  () =>
  (currency: CryptoCurrency, _deviceId: string): Observable<ConcordiumPairingProgress> =>
    new Observable(o => {
      async function main() {
        o.next({ status: ConcordiumPairingStatus.INIT });

        const walletConnectContext = getWalletConnectContext();

        if (!walletConnectContext) {
          throw new Error("WalletConnect context is not available");
        }

        const network = getConcordiumNetwork(currency);
        const chainId = CONCORDIUM_CHAIN_IDS[network];

        const { uri, approval } = await walletConnectContext.initiatePairing(network, chainId);

        if (!uri) {
          throw new Error("WalletConnect connect() returned no URI");
        }

        const walletConnectUri = `${CONCORDIUM_ID_APP_MOBILE_HOST}wallet-connect?encodedUri=${uri}`;

        o.next({ status: ConcordiumPairingStatus.PREPARE, walletConnectUri });

        const approvalTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Proposal expired")), APPROVAL_TIMEOUT_MS),
        );

        const session = await Promise.race([approval(), approvalTimeout]);

        o.next({ status: ConcordiumPairingStatus.SUCCESS, sessionTopic: session.topic });
      }

      main().then(
        () => o.complete(),
        error => {
          o.next({ status: ConcordiumPairingStatus.ERROR });
          o.error(error);
        },
      );
    });

/**
 * Check if an error is a LockedDeviceError or UserRefusedOnDevice and create user-friendly error messages
 */
const handleDeviceErrors = (error: Error): Error | undefined => {
  if (error instanceof TransportStatusError) {
    if (error.statusCode === 0x6985) {
      return new UserRefusedOnDevice("errors.UserRefusedOnDevice.description");
    }
    if (error.statusCode === 0x5515) {
      return new LockedDeviceError("errors.LockedDeviceError.description");
    }
  }
};
