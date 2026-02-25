import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Account, AnyMessage, DeviceId } from "@ledgerhq/types-live";
import bs58 from "bs58";
import invariant from "invariant";
import semver from "semver";
import coinConfig from "./config";
import { toOffChainMessage } from "./offchainMessage/format";
import { SolanaSigner } from "./signer";

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

      signedMessage = toOffChainMessage(message, account.freshAddress, isLegacy);

      return signer.signMessage(account.freshAddressPath, signedMessage.toString("hex"));
    });

    invariant(signedMessage, "signedMessage should exist");

    const signatureCount = Buffer.from([1]);

    // https://docs.anza.xyz/proposals/off-chain-message-signing#envelope
    const envelope = Buffer.concat([signatureCount, result.signature, signedMessage]);

    return { signature: bs58.encode(envelope) };
  };
