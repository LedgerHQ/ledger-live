import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { Account, AnyMessage, DeviceId } from "@ledgerhq/types-live";
import bs58 from "bs58";
import invariant from "invariant";
import semver from "semver";
import coinConfig from "./config";
import { toOffChainMessage, toOffChainMessageV1 } from "./offchainMessage/format";
import { SolanaSigner } from "./signer";

// Returns true for device rejections that should trigger a format fallback
// (e.g. firmware does not support this OCM layout). Propagates user refusals
// and locked-device errors so they are never silently retried.
// Handles both DmkSignerSol (maps to typed errors) and LegacySignerSolana
// (propagates raw TransportStatusError with a numeric statusCode).
function isFormatRejection(err: unknown): boolean {
  if ((err as { name?: string })?.name === "UserRefusedOnDevice") return false;
  if ((err as { name?: string })?.name === "LockedDeviceError") return false;
  // TransportStatusError duck-type: 0x6985 = user refused, 0x5515 = device locked
  if (err && typeof err === "object" && "statusCode" in err) {
    const { statusCode } = err as { statusCode: number };
    if (statusCode === 0x6985 || statusCode === 0x5515) return false;
  }
  return true;
}

export const signMessage =
  (signerContext: SignerContext<SolanaSigner>) =>
  async (
    deviceId: DeviceId,
    account: Account,
    messageOptions: AnyMessage,
  ): Promise<{
    signature: string;
  }> => {
    const message = messageOptions.message;
    if (!message || typeof message !== "string") {
      throw new Error(
        "Sign off-chain message on Solana must be only used with DefaultMessage type",
      );
    }

    let signedMessage: Buffer | undefined;

    const result = await signerContext(deviceId, async signer => {
      const { version } = await signer.getAppConfiguration();
      const isLegacy = semver.lt(version, coinConfig.getCoinConfig().legacyOCMSMaxVersion);

      if (isLegacy) {
        const ocm = toOffChainMessage(message, account.freshAddress, true);
        signedMessage = ocm;
        return signer.signMessage(account.freshAddressPath, ocm.toString("hex"));
      }

      // Step 1 — V1 without length prefix (finalised sRFC 38 spec).
      const v1NoLength = toOffChainMessageV1(message, account.freshAddress, false);
      try {
        const sig = await signer.signMessage(account.freshAddressPath, v1NoLength.toString("hex"));
        signedMessage = v1NoLength;
        return sig;
      } catch (err) {
        if (!isFormatRejection(err)) throw err;
      }

      // Step 2 — V1 with length prefix (pre-sRFC-38 firmware).
      const v1WithLength = toOffChainMessageV1(message, account.freshAddress, true);
      try {
        const sig = await signer.signMessage(
          account.freshAddressPath,
          v1WithLength.toString("hex"),
        );
        signedMessage = v1WithLength;
        return sig;
      } catch (err) {
        if (!isFormatRejection(err)) throw err;
      }

      // Step 3 — V0 fallback (older firmware that does not support V1 at all).
      const v0 = toOffChainMessage(message, account.freshAddress, false);
      signedMessage = v0;
      return signer.signMessage(account.freshAddressPath, v0.toString("hex"));
    });

    invariant(signedMessage, "signedMessage should exist");

    const signatureCount = Buffer.from([1]);

    // https://docs.anza.xyz/proposals/off-chain-message-signing#envelope
    const envelope = Buffer.concat([signatureCount, result.signature, signedMessage]);

    return { signature: bs58.encode(envelope) };
  };
