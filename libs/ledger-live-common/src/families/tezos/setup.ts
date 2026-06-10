// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import type { TezosSigner } from "@ledgerhq/coin-tezos/types/index";
import { signMessage } from "@ledgerhq/coin-tezos/hw-signMessage";
import makeCliTools from "@ledgerhq/coin-tezos/test/cli";
import type { CliTools } from "@ledgerhq/coin-tezos/test/cli";
import tezosResolver from "./getAddress";
import Xtz, { Curve } from "@ledgerhq/hw-app-tezos";
import Transport from "@ledgerhq/hw-transport";
import { createMessageSigner, createResolver, CreateSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<TezosSigner> = (transport: Transport) => {
  const xtz = new Xtz(transport);

  return {
    getAddress: (
      path: string,
      options: {
        verify?: boolean;
        curve?: Curve;
        ins?: number;
      },
    ) => xtz.getAddress(path, options),
    signOperation: (
      path: string,
      rawTxHex: string,
      options: {
        curve?: Curve;
      },
    ) => xtz.signOperation(path, rawTxHex, options),
  };
};

const resolver: Resolver = createResolver(createSigner, tezosResolver);

const messageSigner = {
  signMessage: createMessageSigner(createSigner, signMessage),
};

const cliTools: CliTools = makeCliTools();

export { cliTools, messageSigner, resolver };
