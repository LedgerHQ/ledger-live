import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import { Cell, beginCell, external, storeMessage } from "@ton/core";
import { signVerify } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";
import { WORKCHAIN } from "../constants";
import { readSeqno } from "./transferBody";

/**
 * The wallet's address and, for its first transfer (seqno 0), its StateInit derive from the public
 * key, which the body does not carry.
 */
export function combine(
  tx: string,
  signatures: string[],
  publicKeyHex: string | undefined,
): string {
  if (signatures.length !== 1) {
    throw new InvalidParameterError(`A TON transfer takes one signature, got ${signatures.length}`);
  }
  if (!publicKeyHex)
    throw new InvalidParameterError("Combining a TON transfer needs the public key");

  const body = Cell.fromBase64(tx);
  const signature = Buffer.from(signatures[0], "hex");
  const publicKey = Buffer.from(publicKeyHex, "hex");
  if (
    signature.length !== 64 ||
    publicKey.length !== 32 ||
    !signVerify(body.hash(), signature, publicKey)
  ) {
    throw new InvalidParameterError("The signature does not match this TON transfer and key");
  }

  const wallet = WalletContractV4.create({ workchain: WORKCHAIN, publicKey });
  const message = external({
    to: wallet.address,
    init: readSeqno(body) === 0 ? wallet.init : null,
    body: beginCell().storeBuffer(signature).storeSlice(body.beginParse()).endCell(),
  });
  return beginCell().store(storeMessage(message)).endCell().toBoc().toString("base64");
}
