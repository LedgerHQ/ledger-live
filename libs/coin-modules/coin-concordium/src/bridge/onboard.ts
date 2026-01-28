import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { LockedDeviceError, TransportStatusError, UserRefusedOnDevice } from "@ledgerhq/errors";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { CONCORDIUM_CHAIN_IDS, CONCORDIUM_ID_APP_MOBILE_HOST } from "../constants";
import {
  deserializeCredentialDeploymentTransaction,
  getConcordiumNetwork,
  buildSubmitCredentialData,
} from "../network/utils";
import { getWalletConnect } from "../network/walletConnect";
import { getPublicKey, signCredentialDeployment } from "../signer";
import type { ConcordiumSigner } from "../types";
import {
  AccountOnboardStatus,
  ConcordiumOnboardProgress,
  ConcordiumOnboardResult,
  ConcordiumPairingProgress,
  ConcordiumPairingStatus,
} from "../types/onboard";
import { submitCredential } from "../network/proxyClient";

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
            method: "create_account",
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
          // eslint-disable-next-line no-console
          console.log("buildOnboardAccount error", error);

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

const APPROVAL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

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

          const { uri, approval } = await walletConnect.initiatePairing(network, chainId);

          if (!uri) {
            throw new Error("WalletConnect connect() returned no URI");
          }

          const walletConnectUri = `${CONCORDIUM_ID_APP_MOBILE_HOST}wallet-connect?encodedUri=${uri}`;

          o.next({ status: ConcordiumPairingStatus.PREPARE, walletConnectUri });

          let timeoutId: ReturnType<typeof setTimeout>;
          const approvalTimeout = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error("Proposal expired")),
              APPROVAL_TIMEOUT_MS,
            );
          });

          const session = await Promise.race([approval(), approvalTimeout]).finally(() => {
            clearTimeout(timeoutId);
          });

          o.next({ status: ConcordiumPairingStatus.SUCCESS, sessionTopic: session.topic });
        } catch (error: unknown) {
          // eslint-disable-next-line no-console
          console.log("buildPairWalletConnect error", error);
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
