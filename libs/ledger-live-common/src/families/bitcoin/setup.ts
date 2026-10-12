// The bitcoin family runs on the generic coin framework (ADR-065): this setup only provides the
// device address resolver and the message signer.
import type Transport from "@ledgerhq/hw-transport";
import type { Account, AnyMessage } from "@ledgerhq/types-live";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { GetAddressOptions, Resolver } from "../../hw/getAddress/types";
import type { SignMessage } from "../../hw/signMessage/types";
import { createSigner, resolver as bitcoinResolver, type BitcoinDeviceSigner } from "./signer";

const transportContext =
  (transport: Transport): SignerContext<BitcoinDeviceSigner> =>
  (_, fn) =>
    fn(createSigner(transport));

/** Signs a message with the key of `path` (the fresh address by default). */
export const signMessage =
  (signerContext: SignerContext<BitcoinDeviceSigner>) =>
  async (deviceId: string, account: Account, container: AnyMessage) => {
    if (typeof container.message !== "string") {
      throw new Error("Invalid message type");
    }
    const hexMessage = Buffer.from(container.message).toString("hex");
    const path = "path" in container && container.path ? container.path : account.freshAddressPath;
    const rsv = await signerContext(deviceId, signer =>
      signer.signMessage(account.currency.id, path, hexMessage),
    );
    const v = rsv.v + 27 + 4;
    return { rsv, signature: `${v.toString(16)}${rsv.r}${rsv.s}` };
  };

// Message signing is dispatched on the currency family, so it also serves Zcash (a "bitcoin"
// family currency coin-zcash has no message signer for): the Ledger app of the currency signs it.
export function createMessageSigner(): SignMessage {
  return (transport, account, messageData) =>
    signMessage(transportContext(transport))("", account, messageData);
}

const messageSigner = {
  signMessage: createMessageSigner(),
};

const resolver: Resolver = (
  transport: Transport,
  addressOpt: GetAddressOptions,
): ReturnType<GetAddressFn> => bitcoinResolver(transportContext(transport))("", addressOpt);

export { resolver, messageSigner };
