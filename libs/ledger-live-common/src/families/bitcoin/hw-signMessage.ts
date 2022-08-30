import Btc from "@ledgerhq/hw-app-btc";
import type { SignMessage } from "../../hw/signMessage/types";

const signMessage: SignMessage = async (transport, { path, message }) => {
  const btc = new Btc(transport);
  const hexMessage = Buffer.from(message).toString("hex");
  const result = await btc.signMessageNew(path, hexMessage);
  const v = result["v"] + 27 + 4;
  const signature = Buffer.from(
    `${v.toString(16)}${result["r"]}${result["s"]}`,
    "hex"
  ).toString("base64");
  return {
    rsv: result,
    signature,
  };
};

export default { signMessage };
