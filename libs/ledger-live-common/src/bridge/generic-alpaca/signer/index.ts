import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import xrpGetAddress from "@ledgerhq/coin-xrp/signer/getAddress";
import stellarGetAddress from "@ledgerhq/coin-stellar/signer/getAddress";
import { CreateSigner, executeWithSigner } from "../../setup";
import Xrp from "@ledgerhq/hw-app-xrp";
import Stellar from "@ledgerhq/hw-app-str";

import Transport from "@ledgerhq/hw-transport";
import { signTransaction, stellarSignTransaction } from "./signTransaction";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { SignTransactionOptions } from "./types";

export type AlpacaSigner = {
  getAddress: GetAddressFn;
  signTransaction?: (deviceId: string, opts: SignTransactionOptions) => Promise<string>;
  signMessage?: (message: string) => Promise<string>;
  context: SignerContext<any>;
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
        context: executeWithSigner(createSigner),
      };
    }
    case "stellar": {
      console.log("Using local Stellar Signer");
      const createSigner: CreateSigner<Stellar> = (transport: Transport) => {
        return new Stellar(transport);
      };
      return {
        getAddress: stellarGetAddress(executeWithSigner(createSigner)),
        signTransaction: stellarSignTransaction(executeWithSigner(createSigner)),
        context: executeWithSigner(createSigner),
      };
    }
  }
  throw new Error(`signer for ${network} not implemented`);
}
