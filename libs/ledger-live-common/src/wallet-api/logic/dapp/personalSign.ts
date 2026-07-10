import { prepareMessageToSign } from "../../../hw/signMessage/index";
import { stripHexPrefix } from "../../helpers";
import { withLiveAppContext } from "../../blindSigningContext";
import { DappSignMessage, DappSignMessageContext } from "./types";

/**
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-191.md
 * https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sign
 *
 * Prepares and signs a `personal_sign` message. Fires the dapp personal-sign
 * tracking events and returns the signature. Throws on failure (after tracking
 * the failure).
 */
export async function dappPersonalSignLogic(
  { manifest, account, signerAccount, tracking }: DappSignMessageContext,
  rawMessage: string,
  signMessage: DappSignMessage,
): Promise<string> {
  const nanoApp = manifest.dapp?.nanoApp;
  const dependencies = manifest.dapp?.dependencies;
  try {
    /**
     * The message is received as a prefixed hex string.
     * We need to strip the "0x" prefix.
     */
    const message = stripHexPrefix(rawMessage);
    tracking.dappPersonalSignRequested(manifest);

    const formattedMessage = await prepareMessageToSign(signerAccount, message);

    const options = nanoApp ? { hwAppId: nanoApp, dependencies: dependencies } : undefined;
    const signedMessage = await withLiveAppContext(manifest, () =>
      signMessage({
        account,
        message: formattedMessage,
        options,
      }),
    );

    tracking.dappPersonalSignSuccess(manifest);
    return signedMessage;
  } catch (error) {
    tracking.dappPersonalSignFail(manifest);
    throw error;
  }
}
