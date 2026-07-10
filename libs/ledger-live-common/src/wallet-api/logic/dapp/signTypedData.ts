import { prepareMessageToSign } from "../../../hw/signMessage/index";
import { withLiveAppContext } from "../../blindSigningContext";
import { DappSignMessage, DappSignMessageContext } from "./types";

/**
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
 *
 * Prepares and signs an `eth_signTypedData` message. Fires the dapp
 * sign-typed-data tracking events and returns the signature. Throws on failure
 * (after tracking the failure).
 */
export async function dappSignTypedDataLogic(
  { manifest, account, signerAccount, tracking }: DappSignMessageContext,
  message: string,
  signMessage: DappSignMessage,
): Promise<string> {
  const nanoApp = manifest.dapp?.nanoApp;
  const dependencies = manifest.dapp?.dependencies;
  try {
    tracking.dappSignTypedDataRequested(manifest);

    const formattedMessage = await prepareMessageToSign(
      signerAccount,
      Buffer.from(message).toString("hex"),
    );

    const options = nanoApp ? { hwAppId: nanoApp, dependencies: dependencies } : undefined;
    const signedMessage = await withLiveAppContext(manifest, () =>
      signMessage({
        account,
        message: formattedMessage,
        options,
      }),
    );

    tracking.dappSignTypedDataSuccess(manifest);
    return signedMessage;
  } catch (error) {
    tracking.dappSignTypedDataFail(manifest);
    throw error;
  }
}
