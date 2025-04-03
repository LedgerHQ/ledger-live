import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { Account, AnyMessage, DefaultMessage, DeviceId } from "@ledgerhq/types-live";
import { SolanaSigner } from "./signer";

export const signMessage =
  (signerContext: SignerContext<SolanaSigner>) =>
  async (
    deviceId: DeviceId,
    account: Account,
    messageOpts: AnyMessage,
  ): Promise<{
    signature: string;
  }> => {
    const solanaSignature = await signerContext(deviceId, signer => {
      return signer.signMessage(account.freshAddressPath, (messageOpts as DefaultMessage).message);
    });

    return {
      signature: solanaSignature.signature.toString(),
    };
  };
