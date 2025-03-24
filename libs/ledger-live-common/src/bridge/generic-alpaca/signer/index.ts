import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import xrpGetAddress from "@ledgerhq/coin-xrp/signer/getAddress";
import { CreateSigner, executeWithSigner } from "../../setup";
import Xrp from "@ledgerhq/hw-app-xrp";

import Transport from "@ledgerhq/hw-transport";
import { signTransaction } from "./signTransaction";

export type SignTransactionOptions = {
  rawTxHex: string;
  path: string;
};

export type AlpacaSigner = {
  getAddress: GetAddressFn;
  signTransaction?: (deviceId: string, opts: SignTransactionOptions) => Promise<string>;
  signMessage?: (message: string) => Promise<string>;
};

export function getSigner(network): AlpacaSigner {
  switch (network) {
    case "ripple":
    case "xrp": {
      const createSigner: CreateSigner<Xrp> = (transport: Transport) => {
        return new Xrp(transport);
      };
      return {
        getAddress: xrpGetAddress(executeWithSigner(createSigner)),
        signTransaction: signTransaction(executeWithSigner(createSigner)),
      };
    }
  }
  throw new Error(`signer for ${network} not implemented`);
}
