import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Account, AnyMessage, DeviceId } from "@ledgerhq/types-live";
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

    const result = await signerContext(deviceId, signer => {
      return signer.signMessage(account.freshAddressPath, message);
    });

    return { signature: "0x" + result.signature.toString("hex") };
  };
