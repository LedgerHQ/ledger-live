import { from, Observable } from "rxjs";
import { getSecp256k1Instance } from "@ledgerhq/live-common/families/bitcoin/wallet-btc/crypto/secp256k1";

const cmd = ({ publicKey, tweak }: { publicKey: string; tweak: string }): Observable<string> =>
  from(
    getSecp256k1Instance()
      .publicKeyTweakAdd(
        new Uint8Array(Buffer.from(publicKey, "hex").toJSON().data),
        new Uint8Array(Buffer.from(tweak, "hex").toJSON().data),
      )
      .then(r => Buffer.from(r).toString("hex")),
  );

export default cmd;
