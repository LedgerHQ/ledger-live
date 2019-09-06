// @flow

import Eth from "@ledgerhq/hw-app-eth";
import type { Resolver } from "../../hw/signMessage/types";

const resolver: Resolver = async (
  transport,
  { path, message }
) => {
  const eth = new Eth(transport);
  const hexMessage = Buffer.from(message).toString("hex");
  const result = await eth.signPersonalMessage(path, hexMessage);

  var v = result['v'] - 27;
  v = v.toString(16);
  if (v.length < 2) {
    v = "0" + v;
  }
  const signature = `0x${result['r']}${result['s']}${v}`;

  return { rsv: result, signature };
};

export default resolver;
