import Eth from "@ledgerhq/hw-app-eth";
import eip55 from "eip55";
import { Eth as MMEth, MetaMaskConnector } from "mm-app-eth";
import { getEnv } from "../../env";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (
  transport,
  { path, verify, askChainCode }
) => {
  const eth: Eth | MMEth = await (async () => {
    if (getEnv("SANDBOX_MODE") === 2) {
      const connector = new MetaMaskConnector({
        port: 3333,
      });
      await connector.start();
      return new MMEth(connector.getProvider());
    }
    return new Eth(transport);
  })();
  const r = await eth.getAddress(path, verify, askChainCode || false);
  const address = eip55.encode(r.address);
  return {
    path,
    address,
    publicKey: r.publicKey,
    chainCode: r.chainCode,
  };
};

export default resolver;
