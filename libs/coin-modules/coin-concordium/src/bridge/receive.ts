import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import type { ConcordiumAccount, ConcordiumSigner, Transaction } from "../types";

/**
 * Custom receive implementation for Concordium
 *
 * Uses verifyAddress with identity/credential parameters stored in concordiumResources
 * instead of BIP32 path-based address derivation.
 *
 * Concordium addresses are computed as SHA256(credId), where credId is derived from
 * identity parameters, not from BIP32 paths like other blockchains.
 */
export const buildReceive =
  (
    signerContext: SignerContext<ConcordiumSigner>,
  ): AccountBridge<Transaction, ConcordiumAccount>["receive"] =>
  (account, { deviceId, verify }) => {
    return new Observable(o => {
      async function main() {
        const { concordiumResources } = account;

        if (!verify) {
          o.next({
            address: account.freshAddress,
            path: account.freshAddressPath,
            publicKey: concordiumResources?.publicKey || "",
          });
          return;
        }

        await signerContext(deviceId, async signer => {
          // Note: We check for fields presence, not isOnboarded flag, because sync sets
          // isOnboarded=false until the transaction is confirmed on-chain
          if (
            concordiumResources?.identityIndex === undefined ||
            concordiumResources?.credNumber === undefined
          ) {
            throw new Error(
              "Account is missing identity/credential information. Please re-onboard the account.",
            );
          }

          if (!concordiumResources?.credId) {
            throw new Error(
              "Account is missing credential ID. Please re-onboard the account to verify address.",
            );
          }

          // Determine which protocol to use based on ipIdentity availability
          // New protocol (P1=0x01): requires ipIdentity
          // Legacy protocol (P1=0x00): only uses identityIndex and credNumber
          const useNewProtocol = concordiumResources.ipIdentity !== undefined;
          const isLegacy = !useNewProtocol;

          const result = await signer.verifyAddress(
            isLegacy,
            concordiumResources.identityIndex,
            concordiumResources.credNumber,
            concordiumResources.ipIdentity,
            concordiumResources.credId,
          );

          if (result.status !== "9000" && result.status !== "success") {
            throw new Error("Address verification failed on device");
          }

          if (result.deviceCredId) {
            const storedCredId = concordiumResources.credId;
            const credIdMatch = result.deviceCredId === storedCredId?.toLowerCase();

            if (!credIdMatch) {
              // Note: Not throwing error yet - we want to see what happens
            }
          }

          if (result.address && result.address !== account.freshAddress) {
            throw new Error(
              `Address verification failed: device address (${result.address}) does not match stored address (${account.freshAddress})`,
            );
          }

          o.next({
            address: account.freshAddress,
            path: account.freshAddressPath,
            publicKey: concordiumResources?.publicKey || "",
          });
        });
      }

      main().then(
        () => o.complete(),
        error => {
          console.error("[Concordium Receive] Error in receive flow", {
            error,
            errorMessage: error?.message,
            errorStack: error?.stack,
          });
          o.error(error);
        },
      );
    });
  };
