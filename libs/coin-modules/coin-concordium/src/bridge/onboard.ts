import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { LockedDeviceError, TransportStatusError, UserRefusedOnDevice } from "@ledgerhq/errors";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { CONCORDIUM_CHAIN_IDS, CONCORDIUM_ID_APP_MOBILE_HOST } from "../constants";
import {
  deserializeCredentialDeployment,
  getConcordiumNetwork,
  signCredentialDeployment,
  deserializeCredentialDeploymentTransaction,
} from "../network/onboard";
import { getWalletConnect } from "../network/walletConnect";
import resolver from "../signer";
import type {
  ConcordiumAccount,
  ConcordiumResources,
  ConcordiumSigner,
  SubmitCredentialRequest,
} from "../types";
import type { SerializedCredentialDeploymentDetails } from "../types/onboard";
import {
  AccountOnboardStatus,
  ConcordiumOnboardProgress,
  ConcordiumOnboardResult,
  ConcordiumPairingProgress,
  ConcordiumPairingStatus,
  IDAppErrorCode,
} from "../types/onboard";
import { submitCredential } from "../network/proxyClient";

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
        const walletConnect = getWalletConnect();
        if (!walletConnect) {
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

        const network = getConcordiumNetwork(currency);
        const chainId = CONCORDIUM_CHAIN_IDS[network];

        const session = await walletConnect.getSession(network);
        if (!session) {
          throw new Error(
            `No active WalletConnect session for ${network}. Please pair with Concordium IDApp first.`,
          );
        }

        const createAccountMessage = walletConnect.getCreateAccountMessage(
          publicKey,
          "Create Concordium account from Ledger Live",
        );
        const response = await walletConnect.requestCreateAccount({
          topic: session.topic,
          chainId,
          method: "create_account",
          params: { message: createAccountMessage },
        });

        if (response.status === "error") {
          const errorMessage =
            "details" in response.message ? response.message.details : "unknown error";

          throw new Error(`IDApp create_account failed: ${errorMessage}`);
        }

        if (!("serializedCredentialDeploymentTransaction" in response.message)) {
          throw new Error(
            "Invalid response from IDApp: serializedCredentialDeploymentTransaction is missing or invalid. Please try again.",
          );
        }

        if (!("accountAddress" in response.message)) {
          throw new Error(
            "Invalid response from IDApp: accountAddress is missing or invalid. Please try again.",
          );
        }

        const {
          serializedCredentialDeploymentTransaction,
          accountAddress,
          identityIndex = 0,
          credNumber = 0,
        } = response.message;

        o.next({ status: AccountOnboardStatus.SIGN });

        const signResult = await signCredentialDeployment(
          signerContext,
          deviceId,
          account.freshAddressPath,
          serializedCredentialDeploymentTransaction,
        );

        const signature = signResult?.signature?.[0];

        if (!signature?.length) {
          throw new Error("Failed to obtain signature from device");
        }

        const {
          randomness,
          unsignedCdi: { credId, ipIdentity },
        } = deserializeCredentialDeploymentTransaction(serializedCredentialDeploymentTransaction);

        // Note: Device signs with first key (key index 0), signature should be at signatures[0]
        // Convert signature array to single signature string format expected by web SDK
        // hw-app-concordium returns signature as string[], but web SDK expects single hex string
        const txHash = await walletConnect.submitCCDTransaction(
          {
            expiry: BigInt(serializedCredentialDeploymentTransaction.expiry),
            unsignedCdiStr: serializedCredentialDeploymentTransaction.unsignedCdiStr,
            randomness,
          },
          signature,
          currency,
        );

        const onboardedAccount = createOnboardedAccount(account, accountAddress, currency, {
          identityIndex,
          credNumber,
          ipIdentity,
          publicKey,
          bip32Address, // Use BIP32-derived address for device-account matching
          credId,
        });

        const result: ConcordiumOnboardResult = {
          accountAddress,
          account: onboardedAccount,
          txHash,
          credId,
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

        const walletConnect = getWalletConnect();

        if (!walletConnect) {
          throw new Error("WalletConnect context is not available");
        }

        const network = getConcordiumNetwork(currency);
        const chainId = CONCORDIUM_CHAIN_IDS[network];

        const { uri, approval } = await walletConnect.initiatePairing(network, chainId);

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
