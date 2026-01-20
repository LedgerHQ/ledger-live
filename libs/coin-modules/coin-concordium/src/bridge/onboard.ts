import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { LockedDeviceError, TransportStatusError, UserRefusedOnDevice } from "@ledgerhq/errors";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { CONCORDIUM_CHAIN_IDS, CONCORDIUM_ID_APP_MOBILE_HOST } from "../constants";
import {
  getConcordiumNetwork,
  signCredentialDeployment,
  deserializeCredentialDeploymentTransaction,
} from "../network/onboard";
import { getWalletConnect } from "../network/walletConnect";
import resolver from "../signer";
import type { ConcordiumSigner } from "../types";

import {
  AccountOnboardStatus,
  ConcordiumOnboardProgress,
  ConcordiumOnboardResult,
  ConcordiumPairingProgress,
  ConcordiumPairingStatus,
} from "../types/onboard";

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

        try {
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

          const {
            serializedCredentialDeploymentTransaction,
            identityIndex = 0,
            credNumber = 0,
            accountAddress,
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

          await walletConnect.submitCCDTransaction(
            {
              expiry: BigInt(serializedCredentialDeploymentTransaction.expiry),
              unsignedCdiStr: serializedCredentialDeploymentTransaction.unsignedCdiStr,
              randomness,
            },
            signature,
            currency,
          );

          const result: ConcordiumOnboardResult = {
            account: {
              ...account,
              freshAddress: accountAddress,
              xpub: publicKey,
              seedIdentifier: bip32Address,
              concordiumResources: {
                credId,
                credNumber,
                identityIndex,
                ipIdentity,
                isOnboarded: true,
                publicKey,
              },
            },
          };

          o.next(result);
        } catch (error) {
          console.error("Error during onboardAccount:", { error });
          throw error;
        }
      }

      main().then(
        () => o.complete(),
        error => {
          console.error("buildOnboardAccount: main() error", { error });

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

        try {
          const session = await Promise.race([approval(), approvalTimeout]);

          o.next({ status: ConcordiumPairingStatus.SUCCESS, sessionTopic: session.topic });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          const errorMessage = "message" in error ? error.message : String(error);
          if (errorMessage?.toLowerCase()?.includes("expired")) {
            throw new Error("Pairing proposal expired. Please try again.");
          }

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
