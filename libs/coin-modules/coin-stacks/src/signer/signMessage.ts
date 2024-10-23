import { getBufferFromString, getPath, throwIfError } from "../utils";

// const signMessage: SignMessage = async (transport, account, { message }): Promise<Result> => {
//   const blockstack = new BlockstackApp(transport);

//   if (!message) throw new Error(`Message cannot be empty`);
//   if (typeof message !== "string") throw new Error(`Message must be string`);

//   const r = await blockstack.sign(getPath(account.freshAddressPath), getBufferFromString(message));
//   throwIfError(r);

//   return {
//     rsv: {
//       r: r.signatureCompact.slice(0, 32).toString("hex"),
//       s: r.signatureCompact.slice(32, 64).toString("hex"),
//       v: parseInt(r.signatureCompact.slice(64, 65).toString("hex"), 16),
//     },
//     signature: `0x${r.signatureVRS.toString("hex")}`,
//   };
// };

// export default { signMessage };


import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Account, AnyMessage } from "@ledgerhq/types-live";
import { StacksSigner } from "../types";

export const signMessage =
  (signerContext: SignerContext<StacksSigner>) =>
  async (deviceId: string, account: Account, { message }: AnyMessage) => {

  if (!message) throw new Error(`Message cannot be empty`);
  if (typeof message !== "string") throw new Error(`Message must be string`);

  const r = await signerContext(deviceId, signer => signer.sign(getPath(account.freshAddressPath), getBufferFromString(message)););
  throwIfError(r);


  return {
    rsv: {
      r: r.signatureCompact.slice(0, 32).toString("hex"),
      s: r.signatureCompact.slice(32, 64).toString("hex"),
      v: parseInt(r.signatureCompact.slice(64, 65).toString("hex"), 16),
    },
    signature: `0x${r.signatureVRS.toString("hex")}`,
  };
  };
