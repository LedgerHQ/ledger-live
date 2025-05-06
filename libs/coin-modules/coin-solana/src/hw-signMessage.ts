import semver from "semver";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Account, AnyMessage, DeviceId } from "@ledgerhq/types-live";
import { SolanaSigner } from "./signer";
import { toOffChainMessage } from "./offchainMessage/format";
import coinConfig from "./config";
import bs58 from "bs58";

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

    const result = await signerContext(deviceId, async signer => {
      const { version } = await signer.getAppConfiguration();
      const isLegacy = semver.lt(version, coinConfig.getCoinConfig().legacyOCMSMaxVersion);

      return signer.signMessage(
        account.freshAddressPath,
        toOffChainMessage(message, account.freshAddress, isLegacy).toString("hex"),
      );
    });

    return { signature: bs58.encode(result.signature) };
  };
