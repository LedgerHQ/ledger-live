import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Account, AnyMessage, DefaultMessage, DeviceId } from "@ledgerhq/types-live";
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
    if (!messageOptions.message || typeof messageOptions.message !== "string") {
      throw new Error(
        "Sign off-chain message on Solana must be only used with DefaultMessage type",
      );
    }

    const solanaSignature = await signerContext(deviceId, signer => {
      return signer.signMessage(
        account.freshAddressPath,
        (messageOptions as DefaultMessage).message,
      );
    });

    return {
      signature: solanaSignature.signature.toString(),
    };
  };
