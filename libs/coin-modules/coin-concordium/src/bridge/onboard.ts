import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { LockedDeviceError, TransportStatusError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { CONCORDIUM_CHAIN_IDS, CONCORDIUM_ID_APP_MOBILE_HOST } from "../constants";
import {
  getConcordiumNetwork,
  buildSubmitCredentialData,
  deserializeCredentialDeploymentTransaction,
} from "../network/utils";
import { getWalletConnect } from "../network/walletConnect";
import { getPublicKey, signCredentialDeployment } from "../signer";
import { AccountOnboardStatus, ConcordiumPairingStatus } from "../types";
import type {
  ConcordiumSigner,
  ConcordiumOnboardProgress,
  ConcordiumOnboardResult,
  ConcordiumPairingProgress,
} from "../types";
import { submitCredential } from "../network/proxyClient";

/**
 * Wraps a promise with a 5-minute timeout that automatically cleans up when settled.
 * Prevents timer leaks and unhandled rejections when used in Promise.race().
 */
const withTimeout = <T>(promise: Promise<T>, errorMessage: string): Promise<T> => {
  const REQUEST_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, REQUEST_TIMEOUT_MS);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
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
        o.next({ status: AccountOnboardStatus.INIT });

        try {
          const walletConnect = getWalletConnect();
          if (!walletConnect) {
            throw new Error(
              "WalletConnect context not available. Please ensure Concordium WalletConnect service is initialized.",
            );
          }

          const publicKey = await getPublicKey(signerContext, deviceId, account.freshAddressPath);

          o.next({ status: AccountOnboardStatus.PREPARE });

          const network = getConcordiumNetwork(currency);
          const chainId = CONCORDIUM_CHAIN_IDS[network];

          const session = await walletConnect.getSession(network);
          if (!session) {
            throw new Error(
              `No active WalletConnect session for ${network}. Please pair with Concordium IDApp first.`,
            );
          }

          const response = await walletConnect.requestCreateAccount({
            topic: session.topic,
            chainId,
            params: {
              message: {
                publicKey,
                reason: "Create Concordium account from Ledger Live",
              },
            },
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

          const {
            serializedCredentialDeploymentTransaction,
            identityIndex = 0,
            credNumber = 0,
            accountAddress,
          } = response.message;

          o.next({ status: AccountOnboardStatus.SIGN });

          const credentialDeploymentTransaction = deserializeCredentialDeploymentTransaction(
            serializedCredentialDeploymentTransaction,
          );

          const signature = await signCredentialDeployment(
            signerContext,
            deviceId,
            credentialDeploymentTransaction,
            account.freshAddressPath,
          );

          if (!signature?.length) {
            throw new Error("Failed to obtain signature from device");
          }

          const data = buildSubmitCredentialData(credentialDeploymentTransaction, signature);

          await submitCredential(currency, data);

          const onboardResult: ConcordiumOnboardResult = {
            account: {
              ...account,
              freshAddress: accountAddress,
              xpub: publicKey,
              seedIdentifier: publicKey,
              concordiumResources: {
                credId: credentialDeploymentTransaction.credId,
                credNumber,
                identityIndex,
                ipIdentity: credentialDeploymentTransaction.ipIdentity,
                isOnboarded: true,
                publicKey,
              },
            },
          };

          o.next(onboardResult);
        } catch (error: unknown) {
          log("concordium-onboarding", "Failed to onboard account", { error });
          throw error;
        }
      }

      main().then(
        () => o.complete(),
        error => {
          if (error instanceof TransportStatusError) {
            if (error.statusCode === 0x6985) {
              o.error(new UserRefusedOnDevice("errors.UserRefusedOnDevice.description"));
              return;
            }

            if (error.statusCode === 0x5515) {
              o.error(new LockedDeviceError("errors.LockedDeviceError.description"));
              return;
            }
          }

          o.error(error);
        },
      );
    });

export const buildPairWalletConnect =
  () =>
  (currency: CryptoCurrency, _deviceId: string): Observable<ConcordiumPairingProgress> =>
    new Observable(o => {
      async function main() {
        o.next({ status: ConcordiumPairingStatus.INIT });

        try {
          const walletConnect = getWalletConnect();
          if (!walletConnect) {
            throw new Error("WalletConnect context is not available");
          }

          const network = getConcordiumNetwork(currency);
          const chainId = CONCORDIUM_CHAIN_IDS[network];

          const { uri: encodedUri, approval } = await walletConnect.initiatePairing(
            network,
            chainId,
          );

          if (!encodedUri) {
            throw new Error("WalletConnect connect() returned no URI");
          }

          const walletConnectUri = `${CONCORDIUM_ID_APP_MOBILE_HOST}wallet-connect?encodedUri=${encodedUri}`;
          o.next({ status: ConcordiumPairingStatus.PREPARE, walletConnectUri });

          const session = await withTimeout(
            approval(),
            "Pairing approval is expired. Please try again.",
          );

          o.next({ status: ConcordiumPairingStatus.SUCCESS, sessionTopic: session.topic });
        } catch (error: unknown) {
          log("concordium-onboarding", "Failed to pair Wallet Connect session", { error });
          throw error;
        }
      }

      main().then(
        () => o.complete(),
        error => {
          o.next({ status: ConcordiumPairingStatus.ERROR });
          o.error(error);
        },
      );
    });
